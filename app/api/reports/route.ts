export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role } from "@/src/generated";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== Role.OWNER) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    const businessId = session.user.businessId;

    if (!businessId) {
      return NextResponse.json(
        { message: "Business not found" },
        { status: 404 },
      );
    }

    // KPI Card data
    const transactionSummary = await prisma.transaction.aggregate({
      where: {
        businessId: businessId,
        ...((startDate || endDate) && { date: dateFilter }),
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const activeAgentsCount = await prisma.transaction.groupBy({
      by: ["recordedById"],
      where: {
        businessId: businessId,
        ...((startDate || endDate) && { date: dateFilter }),
      },
      _count: {
        recordedById: true,
      },
    });

    const totalRevenue = transactionSummary._sum.amount || 0;
    const totalTransactions = transactionSummary._count.id || 0;
    const averageTransaction =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Agent Performance Table data
    const agentPerformance = await prisma.transaction.groupBy({
      by: ["recordedById"],
      where: {
        businessId: businessId,
        ...((startDate || endDate) && { date: dateFilter }),
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const agentIds = agentPerformance.map((p: any) => p.recordedById);
    const agents = await prisma.user.findMany({
      where: {
        id: {
          in: agentIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const agentPerformanceData = agentPerformance.map((p: any) => {
      const agent = agents.find((a: any) => a.id === p.recordedById);
      return {
        agentId: p.recordedById,
        agentName: agent?.name || "Unknown Agent",
        transactions: p._count.id,
        totalVolume: p._sum.amount,
        status: "Active", // Placeholder for now
      };
    });

    // Revenue Over Time data
    const transactionsForChart = await prisma.transaction.findMany({
      where: {
        businessId: businessId,
        ...((startDate || endDate) && { date: dateFilter }),
      },
      select: {
        date: true,
        amount: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    const revenueOverTime = transactionsForChart.reduce(
      (acc: any, transaction: any) => {
        const date = transaction.date.toISOString().split("T")[0]; // Get YYYY-MM-DD
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += transaction.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const revenueOverTimeData = Object.entries(revenueOverTime).map(
      ([date, revenue]) => ({
        date,
        revenue,
      }),
    );

    return NextResponse.json({
      totalRevenue,
      totalTransactions,
      activeAgents: activeAgentsCount.length,
      averageTransaction,
      agentPerformance: agentPerformanceData,
      revenueOverTime: revenueOverTimeData,
    });
  } catch (error) {
    console.error("Error fetching report data:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
