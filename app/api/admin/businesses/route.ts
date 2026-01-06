export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const businesses = await prisma.business.findMany({
      include: {
        plan: true,
        _count: {
          select: {
            memberships: true,
            transactions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      businesses.map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        subscriptionStatus: b.subscriptionStatus,
        trialEndsAt: b.trialEndsAt,
        subscriptionEndsAt: b.subscriptionEndsAt,
        planName: b.plan?.businessType || "None",
        memberCount: b._count.memberships,
        transactionCount: b._count.transactions,
        createdAt: b.createdAt,
      })),
    );
  } catch (error) {
    console.error("Error fetching admin businesses:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
