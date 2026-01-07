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

  if (
    !session ||
    !session.user ||
    (session.user.role !== "SUPERADMIN" && session.user.role !== "SUPPORT")
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { subscriptionStatus, trialEndsAt, planId } = await req.json();

    // Restriction: SUPPORT role can only extend trials, not change statuses to ACTIVE/EXPIRED manually
    if (session.user.role === "SUPPORT" && subscriptionStatus) {
      const currentBusiness = await prisma.business.findUnique({
        where: { id },
        select: { subscriptionStatus: true },
      });

      if (currentBusiness?.subscriptionStatus !== subscriptionStatus) {
        return NextResponse.json(
          {
            message:
              "Support agents can only extend trials, not change subscription statuses.",
          },
          { status: 403 },
        );
      }
    }

    const data: any = {};
    if (
      subscriptionStatus !== undefined &&
      session.user.role === "SUPERADMIN"
    ) {
      data.subscriptionStatus = subscriptionStatus;
    }
    if (trialEndsAt !== undefined) {
      data.trialEndsAt = new Date(trialEndsAt);
    }
    if (planId !== undefined && session.user.role === "SUPERADMIN") {
      data.planId = planId;
    }

    const updatedBusiness = await prisma.business.update({
      where: { id },
      data,
    });

    await logAction("BUSINESS_SUBSCRIPTION_UPDATE", session.user.id, {
      businessId: id,
      subscriptionStatus,
      trialEndsAt,
      planId,
      updatedByRole: session.user.role,
    });

    return NextResponse.json(updatedBusiness);
  } catch (error) {
    console.error("Error updating business:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
