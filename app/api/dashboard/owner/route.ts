import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format, eachDayOfInterval } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== "OWNER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { businessId } = session.user;

  if (!businessId) {
    return new NextResponse("Business not found", { status: 404 });
  }

  try {
    // KPIs
    const financialAccounts = await prisma.financialAccount.findMany({
      where: { businessId },
    });

    const totalBalance = financialAccounts.reduce(
      (sum, account) => sum + account.balance,
      0
    );
    const cashBalance =
      financialAccounts
        .find((acc) => acc.type === "CASH")
        ?.balance.toString() ?? "0";
    const bankBalance =
      financialAccounts
        .find((acc) => acc.type === "BANK")
        ?.balance.toString() ?? "0";

    const today = startOfDay(new Date());
    const todaysTransactions = await prisma.transaction.findMany({
      where: {
        businessId,
        date: {
          gte: today,
        },
      },
      include: {
        type: true,
      },
    });

    const todaysNet = todaysTransactions.reduce((sum, tx) => {
      if (tx.type.name === "Deposit" || tx.type.name === "Charge") {
        return sum + tx.amount;
      } else if (tx.type.name === "Withdrawal" || tx.type.name === "Expense") {
        return sum - tx.amount;
      }
      return sum;
    }, 0);

    const activeAgentTransactions = await prisma.transaction.findMany({
      where: {
        businessId,
        date: {
          gte: today,
        },
      },
      distinct: ["recordedById"],
      select: {
        recordedById: true,
      },
    });
    const activeAgents = activeAgentTransactions.length;

    const pendingReconciliations = await prisma.dailySummary.count({
      where: {
        businessId,
        reconciled: false,
      },
    });

    // Charts
    const sevenDaysAgo = subDays(today, 6);
    const last7DaysTransactions = await prisma.transaction.findMany({
      where: {
        businessId,
        date: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        type: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    const dateRange = eachDayOfInterval({
      start: sevenDaysAgo,
      end: today,
    });
    const labels = dateRange.map((date) => format(date, "EEE"));
    const dailyData = dateRange.reduce((acc, date) => {
      const formattedDate = format(date, "yyyy-MM-dd");
      acc[formattedDate] = { revenue: 0, expenses: 0 };
      return acc;
    }, {} as Record<string, { revenue: number; expenses: number }>);

    last7DaysTransactions.forEach((tx) => {
      const formattedDate = format(tx.date, "yyyy-MM-dd");
      if (dailyData[formattedDate]) {
        if (tx.type.name === "Deposit" || tx.type.name === "Charge") {
          dailyData[formattedDate].revenue += tx.amount;
        } else if (
          tx.type.name === "Withdrawal" ||
          tx.type.name === "Expense"
        ) {
          dailyData[formattedDate].expenses += tx.amount;
        }
      }
    });

    const revenueData = Object.values(dailyData).map((d) => d.revenue);
    const expensesData = Object.values(dailyData).map((d) => d.expenses);

    const revenueVsExpensesData = {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: revenueData,
          backgroundColor: "rgba(101, 116, 205, 0.8)",
        },
        {
          label: "Expenses",
          data: expensesData,
          backgroundColor: "rgba(255, 107, 107, 0.8)",
        },
      ],
    };

    // Recent Transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { businessId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        recordedBy: {
          select: {
            name: true,
          },
        },
        type: true,
      },
    });

    // Reconciliation Data
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
      },
    });

    const agentReconciliationMap = new Map();

    for (const agent of agents) {
      agentReconciliationMap.set(agent.id, {
        name: agent.name || "Unnamed Agent",
        expected: 0,
        submitted: 0,
      });
    }

    for (const transaction of todaysTransactions) {
      const agentData = agentReconciliationMap.get(transaction.recordedById);
      if (agentData) {
        if (transaction.type?.name) {
          const transactionTypeName = transaction.type.name.toLowerCase();
          if (transactionTypeName === "charge") {
            agentData.expected += transaction.amount;
          }
          if (
            transactionTypeName === "deposit" &&
            transaction.paymentMethod === "CASH"
          ) {
            agentData.submitted += transaction.amount;
          }
        }
      }
    }

    const dailyReconciliation = Array.from(agentReconciliationMap.values()).map(
      (data) => {
        const difference = data.submitted - data.expected;
        return {
          ...data,
          difference,
          status: difference === 0 ? "Reconciled" : "Pending",
        };
      }
    );

    const data = {
      kpis: {
        totalBalance,
        todaysNet,
        activeAgents,
        pendingReconciliations,
      },
      charts: {
        revenueVsExpensesData,
        cashVsBankData: {
          labels: ["Cash", "Bank"],
          datasets: [
            {
              data: [cashBalance, bankBalance],
              backgroundColor: [
                "rgba(101, 116, 205, 0.8)",
                "rgba(255, 107, 107, 0.8)",
              ],
              hoverBackgroundColor: [
                "rgba(101, 116, 205, 1)",
                "rgba(255, 107, 107, 1)",
              ],
            },
          ],
        },
      },
      recentTransactions: recentTransactions.map((tx) => ({
        datetime: format(tx.createdAt, "yyyy-MM-dd HH:mm"),
        agent: tx.recordedBy.name,
        type: tx.type.name,
        method: tx.paymentMethod,
        amount: tx.amount,
        status: "Completed",
      })),
      dailyReconciliation,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching owner dashboard data:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
