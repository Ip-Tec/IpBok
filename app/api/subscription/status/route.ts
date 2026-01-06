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
      monthlyPrice: business.plan?.monthlyPrice || 0,
      trialEndsAt: business.trialEndsAt,
      subscriptionEndsAt: business.subscriptionEndsAt,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
