export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { differenceInDays, isAfter } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.businessId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId },
      include: {
        plan: {
          select: {
            monthlyPrice: true,
          },
        },
      },
    });

    if (!business) {
      return new NextResponse("Business not found", { status: 404 });
    }

    // If no direct plan link, try to find one matching the business type
    let planId = business.planId;
    let monthlyPrice = business.plan?.monthlyPrice || 0;

    // Default the type for plan lookup if it's missing (e.g. legacy or new registration)
    const activeType = business.type || "PERSONAL";

    if (!planId) {
      const defaultPlan = await prisma.pricingPlan.findUnique({
        where: { businessType: activeType as any },
      });
      if (defaultPlan) {
        planId = defaultPlan.id;
        monthlyPrice = defaultPlan.monthlyPrice;

        // Proactively update the business record if it's missing either type or planId
        // This ensures the next check is faster and data is consistent
        await prisma.business.update({
          where: { id: business.id },
          data: {
            type: activeType as any,
            planId: planId,
          },
        });
      }
    }

    const now = new Date();
    let status = business.subscriptionStatus;
    let daysRemaining = 0;

    if (status === "TRIAL" && business.trialEndsAt) {
      if (isAfter(now, business.trialEndsAt)) {
        status = "EXPIRED";
        // Update DB status if it was TRIAL but time passed
        await prisma.business.update({
          where: { id: business.id },
          data: { subscriptionStatus: "EXPIRED" },
        });
      } else {
        daysRemaining = differenceInDays(business.trialEndsAt, now);
      }
    } else if (status === "ACTIVE" && business.subscriptionEndsAt) {
      if (isAfter(now, business.subscriptionEndsAt)) {
        status = "EXPIRED";
      } else {
        daysRemaining = differenceInDays(business.subscriptionEndsAt, now);
      }
    }

    return NextResponse.json({
      status,
      daysRemaining,
      planName: business.type,
      planId: planId,
      monthlyPrice: monthlyPrice,
      trialEndsAt: business.trialEndsAt,
      subscriptionEndsAt: business.subscriptionEndsAt,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
