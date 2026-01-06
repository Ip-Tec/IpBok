export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.businessId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { planId } = await req.json();

    if (!planId) {
      return new NextResponse("Plan ID is required", { status: 400 });
    }

    const plan = await prisma.pricingPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return new NextResponse("Plan not found", { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId },
    });

    if (!business) {
      return new NextResponse("Business not found", { status: 404 });
    }

    // Paystack initialization
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }

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
          amount: plan.monthlyPrice * 100, // Paystack uses kobo (subunits)
          callback_url: `${process.env.NEXTAUTH_URL}/api/payment/callback`,
          metadata: {
            businessId: business.id,
            planId: plan.id,
            businessType: plan.businessType,
          },
        }),
      },
    );

    const data = await response.json();

    if (!data.status) {
      throw new Error(
        data.message || "Failed to initialize Paystack transaction",
      );
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
