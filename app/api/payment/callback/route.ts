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

    const data = await response.json();

    if (data.status && data.data.status === "success") {
      const { businessId, planId, months } = data.data.metadata;

      // Ensure we are updating the correct business
      if (businessId !== session.user.businessId) {
        return new NextResponse("Unauthorized business update", {
          status: 403,
        });
      }

      // Update business status
      const now = new Date();
      const durationDays = (months || 1) * 30;
      const subscriptionEndsAt = addDays(now, durationDays);

      await prisma.business.update({
        where: { id: businessId },
        data: {
          subscriptionStatus: "ACTIVE",
          planId: planId,
          subscriptionEndsAt: subscriptionEndsAt,
        },
      });

      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?status=success`,
      );
    } else {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?status=failed&message=${data.message}`,
      );
    }
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?status=error`,
    );
  }
}
