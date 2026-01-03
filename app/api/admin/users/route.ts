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
    const users = await prisma.user.findMany({
      include: {
        memberships: {
          include: {
            business: {
              select: { name: true }
            }
          }
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      verified: !!u.emailVerified,
      transactionCount: u._count.transactions,
      businesses: u.memberships.map(m => m.business.name),
    })));
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
