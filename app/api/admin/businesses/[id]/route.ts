import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== "SUPERADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { subscriptionStatus, trialEndsAt, planId } = await req.json();

    const updatedBusiness = await prisma.business.update({
      where: { id },
      data: {
        subscriptionStatus,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : undefined,
        planId,
      },
    });

    await logAction("BUSINESS_SUBSCRIPTION_UPDATE", session.user.id, {
      businessId: id,
      subscriptionStatus,
      trialEndsAt,
      planId,
    });

    return NextResponse.json(updatedBusiness);
  } catch (error) {
    console.error("Error updating business:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
