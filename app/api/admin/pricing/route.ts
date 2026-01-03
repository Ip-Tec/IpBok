export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "SUPPORT")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const plans = await prisma.pricingPlan.findMany({
      select: {
        id: true,
        businessType: true,
        monthlyPrice: true,
        trialDays: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    return NextResponse.json(plans);
  } catch (error: any) {
    console.error("Error fetching pricing plans:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== "SUPERADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id, monthlyPrice, trialDays } = await req.json();

    const updatedPlan = await prisma.pricingPlan.update({
      where: { id },
      data: {
        monthlyPrice: parseFloat(monthlyPrice),
        trialDays: parseInt(trialDays),
      },
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("Error updating pricing plan:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
