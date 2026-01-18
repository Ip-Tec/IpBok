export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { planId, months = 1 } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 },
      );
    }

    const plan = await prisma.pricingPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Paystack initialization
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }

    const nextAuthUrl = process.env.NEXTAUTH_URL;
    if (!nextAuthUrl) {
      throw new Error("NEXTAUTH_URL is not configured");
    }

    const amount = plan.monthlyPrice * months * 100; // Total amount in kobo

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          amount: amount,
          callback_url: `${nextAuthUrl}/api/payment/callback`,
          metadata: {
            businessId: business.id,
            planId: plan.id,
            businessType: plan.businessType,
            months: months, // Pass months to callback
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to initialize Paystack transaction: ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (!data.status) {
      throw new Error(
        data.message || "Failed to initialize Paystack transaction",
      );
    }

    if (!data.data || !data.data.authorization_url) {
      throw new Error("No authorization URL received from Paystack");
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error: any) {
    console.error("Error initializing payment:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
