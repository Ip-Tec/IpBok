export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!session || !session.user || !session.user.businessId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!reference) {
    return new NextResponse("Reference is required", { status: 400 });
  }

  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }

    // Verify transaction with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Paystack API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || "Paystack API returned an error");
    }

    if (data.data.status === "success") {
      const metadata = data.data.metadata || {};
      const { businessId, planId, months, businessType } = metadata;

      // Ensure we are updating the correct business
      if (!businessId || businessId !== session.user.businessId) {
        console.error("Business ID mismatch or missing", {
          sessionBusinessId: session.user.businessId,
          metadataBusinessId: businessId,
        });
        return new NextResponse("Unauthorized business update", {
          status: 403,
        });
      }

      // Validate required metadata
      if (!planId) {
        throw new Error("Plan ID not found in transaction metadata");
      }

      // Fetch current business state to determine extension base date
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { subscriptionEndsAt: true },
      });

      // Update business status
      const now = new Date();
      const durationDays = (months || 1) * 30;

      // Calculate new end date: extend existing if valid, otherwise start from now
      const currentExpiry = business?.subscriptionEndsAt
        ? new Date(business.subscriptionEndsAt)
        : now;
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const subscriptionEndsAt = addDays(baseDate, durationDays);

      await prisma.business.update({
        where: { id: businessId },
        data: {
          subscriptionStatus: "ACTIVE",
          planId: planId,
          // Sync business type if provided in metadata (from plan)
          ...(businessType && { type: businessType }),
          subscriptionEndsAt: subscriptionEndsAt,
        },
      });

      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?status=success`,
      );
    } else {
      const errorMessage = encodeURIComponent(data.data?.status || data.message || "Unknown error");
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?status=failed&message=${errorMessage}`,
      );
    }
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    const errorMsg = encodeURIComponent(error.message || "Payment verification failed");
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?status=error&message=${errorMsg}`,
    );
  }
}
