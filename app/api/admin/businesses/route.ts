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
    const businesses = await prisma.business.findMany({
      include: {
        _count: {
          select: { memberships: true, transactions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(businesses.map(b => ({
      id: b.id,
      name: b.name,
      type: b.type,
      address: b.address,
      phone: b.phone,
      memberCount: b._count.memberships,
      transactionCount: b._count.transactions,
      createdAt: b.createdAt,
    })));
  } catch (error) {
    console.error("Error fetching admin businesses:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
