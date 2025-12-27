import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== "OWNER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { businessId } = session.user;

  if (!businessId) {
    return new NextResponse("Business not found", { status: 404 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30"); // Default to 30 days
    const startDate = subDays(new Date(), days);
    const today = startOfDay(new Date());

    // Get all agents for this business
    const agents = await prisma.user.findMany({
      where: {
        role: "AGENT",
        memberships: {
          some: {
            businessId: businessId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Get all confirmed cash advances for these agents
    const cashAdvances = await prisma.cashAdvance.findMany({
      where: {
        businessId: businessId,
        status: "CONFIRMED",
        date: {
          gte: startDate,
        },
        receivedById: {
          in: agents.map(a => a.id),
        },
      },
      select: {
        id: true,
        amount: true,
        date: true,
        receivedById: true,
        description: true,
      },
    });

    // Get all charge transactions from these agents
    const chargeTransactions = await prisma.transaction.findMany({
      where: {
        businessId: businessId,
        recordedById: {
          in: agents.map(a => a.id),
        },
        date: {
          gte: startDate,
        },
        type: {
          name: "Charge",
        },
      },
      select: {
        id: true,
        amount: true,
        date: true,
        recordedById: true,
        description: true,
      },
    });

    // Calculate summary for each agent
    const agentSummaries = agents.map(agent => {
      const totalCashGiven = cashAdvances
        .filter(ca => ca.receivedById === agent.id)
        .reduce((sum, ca) => sum + ca.amount, 0);

      const totalCharges = chargeTransactions
        .filter(ct => ct.recordedById === agent.id)
        .reduce((sum, ct) => sum + ct.amount, 0);

      const profit = totalCharges - totalCashGiven;
      const profitMargin = totalCashGiven > 0 ? (profit / totalCashGiven) * 100 : 0;

      // Get cash advances for this agent
      const agentCashAdvances = cashAdvances
        .filter(ca => ca.receivedById === agent.id)
        .map(ca => ({
          id: ca.id,
          amount: ca.amount,
          date: ca.date,
          description: ca.description,
        }));

      return {
        agentId: agent.id,
        agentName: agent.name || "Unnamed Agent",
        agentEmail: agent.email,
        totalCashGiven,
        totalCharges,
        profit,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        cashAdvances: agentCashAdvances,
        transactionCount: chargeTransactions.filter(ct => ct.recordedById === agent.id).length,
      };
    });

    // Calculate overall totals
    const overallTotal = {
      totalCashGiven: agentSummaries.reduce((sum, a) => sum + a.totalCashGiven, 0),
      totalCharges: agentSummaries.reduce((sum, a) => sum + a.totalCharges, 0),
      totalProfit: agentSummaries.reduce((sum, a) => sum + a.profit, 0),
      totalTransactions: chargeTransactions.length,
    };

    return NextResponse.json({
      period: {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(today, "yyyy-MM-dd"),
        days,
      },
      agents: agentSummaries,
      overall: overallTotal,
    });
  } catch (error) {
    console.error("Error fetching agent profit summary:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

