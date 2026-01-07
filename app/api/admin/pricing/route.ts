export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BusinessType } from "@prisma/client";
import { logAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    (session.user.role !== "SUPERADMIN" && session.user.role !== "SUPPORT")
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const plans = await prisma.pricingPlan.findMany({
      orderBy: { businessType: "asc" },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== "SUPERADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { businessType, monthlyPrice, trialDays } = await req.json();

    if (!businessType) {
      return NextResponse.json(
        { error: "Business type is required" },
        { status: 400 },
      );
    }

    const plan = await prisma.pricingPlan.upsert({
      where: { businessType: businessType as BusinessType },
      update: {
        monthlyPrice: parseFloat(monthlyPrice),
        trialDays: parseInt(trialDays),
      },
      create: {
        businessType: businessType as BusinessType,
        monthlyPrice: parseFloat(monthlyPrice),
        trialDays: parseInt(trialDays),
      },
    });

    await logAction("PRICING_PLAN_UPDATE", session.user.id, {
      businessType,
      monthlyPrice,
      trialDays,
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error saving pricing plan:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
