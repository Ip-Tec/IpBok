export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BusinessType } from "@/src/generated";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type } = await req.json();

    if (!Object.values(BusinessType).includes(type)) {
      return NextResponse.json(
        { message: "Invalid business type" },
        { status: 400 },
      );
    }

    const plan = await prisma.pricingPlan.findUnique({
      where: { businessType: type as BusinessType },
    });

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + (plan?.trialDays || 30));

    await prisma.business.update({
      where: { id: session.user.businessId },
      data: {
        type: type as BusinessType,
        trialEndsAt: trialEndsAt,
        planId: plan?.id,
        subscriptionStatus: "TRIAL",
      },
    });

    return NextResponse.json({ message: "Business type updated successfully" });
  } catch (error) {
    console.error("Error updating business type:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
