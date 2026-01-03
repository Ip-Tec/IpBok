import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "SUPPORT")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);

    // Global Stats
    const totalBusinesses = await prisma.business.count();
    const totalUsers = await prisma.user.count();
    
    const activeBusinessesToday = await prisma.transaction.findMany({
      where: {
        date: { gte: today },
      },
      distinct: ["businessId"],
      select: { businessId: true },
    });

    const totalTransactionsToday = await prisma.transaction.count({
      where: { date: { gte: today } },
    });

    const totalVolumeToday = await prisma.transaction.aggregate({
      where: { date: { gte: today } },
      _sum: { amount: true },
    });

    // Recent Businesses
    const recentBusinesses = await prisma.business.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalBusinesses,
        totalUsers,
        activeBusinesses: activeBusinessesToday.length,
        totalTransactionsToday,
        totalVolumeToday: totalVolumeToday._sum.amount || 0,
      },
      recentBusinesses: recentBusinesses.map(b => ({
        id: b.id,
        name: b.name,
        type: b.type,
        members: b._count.memberships,
        createdAt: b.createdAt,
      })),
      systemStatus: "Healthy",
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
