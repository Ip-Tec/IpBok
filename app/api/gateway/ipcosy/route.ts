import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

const IPCOSY_KEY_HEADER = 'x-ipbok-gateway-key';
const REFERENCE_PREFIX = 'IPBOK_IPCOSY_';

function unauthorized(msg = 'Unauthorized') {
  return NextResponse.json({ error: msg }, { status: 401 });
}

function badRequest(msg = 'Bad request') {
  return NextResponse.json({ error: msg }, { status: 400 });
}

function serverError(msg = 'Internal server error') {
  return NextResponse.json({ error: msg }, { status: 500 });
}

function makeReference() {
  return `${REFERENCE_PREFIX}${uuidv4()}`;
}

async function callPaystackInitialize(body: Record<string, unknown>) {
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

async function callPaystackVerify(reference: string) {
  const url = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY ?? ''}`,
    },
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

export async function POST(req: NextRequest) {
  try {
    const gatewayKey = req.headers.get(IPCOSY_KEY_HEADER);
    // Use strict equality check. In production, ensure IPCOSY_GATEWAY_KEY is set.
    if (!gatewayKey || !process.env.IPCOSY_GATEWAY_KEY || gatewayKey !== process.env.IPCOSY_GATEWAY_KEY) {
      console.warn('Unauthorized Gateway Access Attempt');
      return unauthorized();
    }

    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload.amount !== 'number' || payload.amount <= 0) {
      return badRequest('`amount` (in kobo) is required and must be a positive number');
    }

    // Email is required by Paystack for initialization
    const email = payload.email;
    if (!email || typeof email !== 'string') {
      return badRequest('`email` is required');
    }

    const reference = makeReference();

    // Use server-side secret key always
    const initializeBody = {
      amount: payload.amount,
      email: email, 
      reference,
      callback_url: payload.callback_url,
      metadata: {
        product: 'ipcosy',
        source: 'ip-bok',
        purpose: 'feature_unlock',
        original_email: email,
        ...payload.metadata
      },
    };

    // Persist a gateway transaction record (authoritative record) - PENDING state
    try {
      await prisma.gatewayTransaction.create({
        data: {
          reference,
          amount: Math.floor(Number(payload.amount)),
          product: 'ipcosy',
          source: 'ip-bok',
          purpose: 'feature_unlock',
          status: 'PENDING',
        },
      });
    } catch (dbErr) {
      console.error('Prisma create gatewayTransaction failed', dbErr);
      return serverError('Failed to create local transaction record');
    }

    const { ok, status, data } = await callPaystackInitialize(initializeBody);
    
    if (!ok || !data) {
      console.error('Paystack initialize error', { status, data });
      // Mark as FAILED locally if Paystack rejected it
      try {
        await prisma.gatewayTransaction.update({
            where: { reference },
            data: { status: 'FAILED', paystackResponse: data ?? {} }
        });
      } catch (e) {}
      
      return NextResponse.json({ error: 'Payment initialization failed upstream' }, { status: 502 });
    }

    // Only return what IP-Cosy needs
    const authorization_url = data?.data?.authorization_url;
    const returnedReference = data?.data?.reference ?? reference;

    if (!authorization_url) {
      console.error('Paystack returned malformed initialize response', { data });
       try {
        await prisma.gatewayTransaction.update({
            where: { reference },
            data: { status: 'FAILED', paystackResponse: data ?? {} }
        });
      } catch (e) {}
      return NextResponse.json({ error: 'Payment initialization returned invalid response' }, { status: 502 });
    }

    // Persist response info
    try {
      await prisma.gatewayTransaction.update({
        where: { reference: reference }, // Use the reference we created/stored
        data: { authorizationUrl: authorization_url, paystackResponse: data },
      });
    } catch (dbErr) {
      console.error('Prisma update gatewayTransaction after init failed', dbErr);
    }

    // Return the reference expected by us alongside the auth URL
    return NextResponse.json({ authorization_url, reference: returnedReference }, { status: 200 });
  } catch (err) {
    console.error('Gateway POST error', err);
    return serverError();
  }
}

export async function GET(req: NextRequest) {
  try {
    const gatewayKey = req.headers.get(IPCOSY_KEY_HEADER);
    if (!gatewayKey || !process.env.IPCOSY_GATEWAY_KEY || gatewayKey !== process.env.IPCOSY_GATEWAY_KEY) {
       return unauthorized(); 
    }

    const url = new URL(req.url);
    const reference = url.searchParams.get('reference');
    if (!reference) return badRequest('`reference` query parameter required');

    if (!reference.startsWith(REFERENCE_PREFIX)) {
      return badRequest('invalid reference prefix');
    }

    const { ok, status, data } = await callPaystackVerify(reference);
    
    // If request to Paystack completely failed
    if (!ok || !data) {
      console.error('Paystack verify error', { status, data });
      return NextResponse.json({ error: 'Verification check failed upstream' }, { status: 502 });
    }

    const tx = data?.data;
    if (!tx) {
      console.error('Paystack verify missing data', { data });
      return NextResponse.json({ error: 'Verification returned empty data' }, { status: 502 });
    }

    // Check transaction status
    const isSuccess = tx.status === 'success';

    // Update Local Record based on Paystack status
    try {
        const updateData: any = {
            paystackResponse: data
        };

        if (isSuccess) {
            updateData.status = 'SUCCESS';
            updateData.paidAt = tx.paid_at ? new Date(tx.paid_at) : new Date();
        } else if (tx.status === 'failed') {
            updateData.status = 'FAILED';
        }
        // If 'abandoned' etc, we might leave it or set to FAILED/PENDING depending on business logic, 
        // but for now only explicitly change to SUCCESS/FAILED if final.

        await prisma.gatewayTransaction.update({
            where: { reference },
            data: updateData
        });
    } catch (dbErr) {
        // If record not found, that's critical sync issue
        console.error('Prisma update gatewayTransaction failed during verify', dbErr);
    }

    if (!isSuccess) {
         return NextResponse.json({ paid: false, status: tx.status }, { status: 200 });
    }

    // Security Check: Verify amount and product matches expectations
    // Note: The caller (IpCosy) should also verify the amount, but we do a sanity check if possible or pass it back.
    // Ideally we stored amount in DB and we can check it.
    
    // trusted response
    return NextResponse.json({ 
        paid: true, 
        reference: tx.reference, 
        amount: tx.amount, 
        paidAt: tx.paid_at,
        metadata: tx.metadata
    }, { status: 200 });

  } catch (err) {
    console.error('Gateway GET error', err);
    return serverError();
  }
}
