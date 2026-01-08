export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format, eachDayOfInterval } from "date-fns";

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
    // KPIs
    const financialAccounts = await prisma.financialAccount.findMany({
      where: { businessId },
    });

    const totalBalance = financialAccounts.reduce(
      (sum: number, account: any) => sum + account.balance,
      0,
    );
    const cashBalance = financialAccounts
      .filter((acc: any) => acc.type === "CASH")
      .reduce((sum: number, acc: any) => sum + acc.balance, 0);

    const bankBalance = financialAccounts
      .filter((acc: any) => acc.type === "BANK")
      .reduce((sum: number, acc: any) => sum + acc.balance, 0);

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

    // Calculate Today's Net
    const todaysNet = todaysTransactions.reduce((sum: number, tx: any) => {
      if (
        tx.type.name === "Deposit" ||
        tx.type.name === "Charge" ||
        tx.type.name === "Income"
      ) {
        return sum + tx.amount;
      } else if (tx.type.name === "Withdrawal" || tx.type.name === "Expense") {
        return sum - tx.amount;
      }
      return sum;
    }, 0);

    // Calculate Month-to-Date Income and Expenses
    const startOfCurrentMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const monthTransactions = await prisma.transaction.findMany({
      where: {
        businessId,
        date: {
          gte: startOfCurrentMonth,
        },
      },
      include: {
        type: true,
      },
    });

    let currentMonthIncome = 0;
    let currentMonthExpenses = 0;
    const categoryMap: Record<string, number> = {};

    monthTransactions.forEach((tx: any) => {
      if (
        tx.type.name === "Deposit" ||
        tx.type.name === "Charge" ||
        tx.type.name === "Income"
      ) {
        currentMonthIncome += tx.amount;
        const category = tx.category || "Uncategorized";
        categoryMap[category] = (categoryMap[category] || 0) + tx.amount;
      } else if (tx.type.name === "Withdrawal" || tx.type.name === "Expense") {
        currentMonthExpenses += tx.amount;
        const category = tx.category || "Uncategorized";
        categoryMap[category] = (categoryMap[category] || 0) + tx.amount;
      }
    });

    const categoryLabels = Object.keys(categoryMap);
    const categoryValues = Object.values(categoryMap);

    // Agent-related metrics are irrelevant for PERSONAL accounts
    let activeAgents = 0;
    let pendingReconciliations = 0;
    let dailyReconciliation: any[] = [];

    if (session.user.businessType !== "PERSONAL") {
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
      activeAgents = activeAgentTransactions.length;

      pendingReconciliations = await prisma.dailySummary.count({
        where: {
          businessId,
          reconciled: false,
        },
      });
    }

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
    const dailyData = dateRange.reduce(
      (acc, date) => {
        const formattedDate = format(date, "yyyy-MM-dd");
        acc[formattedDate] = { revenue: 0, expenses: 0 };
        return acc;
      },
      {} as Record<string, { revenue: number; expenses: number }>,
    );

    last7DaysTransactions.forEach((tx: any) => {
      const formattedDate = format(tx.date, "yyyy-MM-dd");
      if (dailyData[formattedDate]) {
        if (
          tx.type.name === "Deposit" ||
          tx.type.name === "Charge" ||
          tx.type.name === "Income"
        ) {
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

    // Reconciliation Data (Only for non-PERSONAL)
    if (session.user.businessType !== "PERSONAL") {
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
          cashGiven: 0, // Cash given to agent (Cash Advance transactions)
          cashInAccount: 0, // Cash in account (from deposits)
          charges: 0, // Profit from charges
        });
      }

      // Calculate cash given to agents (Cash Advances that are CONFIRMED)
      const cashAdvances = await prisma.cashAdvance.findMany({
        where: {
          businessId,
          date: {
            gte: today,
          },
          status: "CONFIRMED", // Only count confirmed cash advances
        },
        select: {
          amount: true,
          receivedById: true,
        },
      });

      for (const cashAdvance of cashAdvances) {
        if (cashAdvance.receivedById) {
          const agentData = agentReconciliationMap.get(
            cashAdvance.receivedById,
          );
          if (agentData) {
            agentData.cashGiven += cashAdvance.amount;
          }
        }
      }

      // Calculate cash in account and charges from today's transactions
      for (const transaction of todaysTransactions) {
        const agentData = agentReconciliationMap.get(transaction.recordedById);
        if (agentData) {
          if (transaction.type?.name) {
            const transactionTypeName = transaction.type.name.toLowerCase();
            // Track charges (profit)
            if (transactionTypeName === "charge") {
              agentData.charges += transaction.amount;
            }
            // Track cash deposits (cash in account)
            if (
              transactionTypeName === "deposit" &&
              transaction.paymentMethod === "CASH"
            ) {
              agentData.cashInAccount += transaction.amount;
            }
          }
        }
      }

      dailyReconciliation = Array.from(agentReconciliationMap.values()).map(
        (data) => {
          // Expected = Cash Given (what owner gave to agent)
          // Submitted = Cash in Account (what agent has from deposits)
          // Difference = Cash in Account - Cash Given (should match if reconciled)
          const expected = data.cashGiven;
          const submitted = data.cashInAccount;
          const difference = submitted - expected;
          return {
            name: data.name,
            expected,
            submitted,
            charges: data.charges, // Profit from charges
            difference,
            status: difference === 0 ? "Reconciled" : "Pending",
          };
        },
      );
    }

    const data = {
      kpis: {
        totalBalance,
        cashBalance,
        bankBalance,
        todaysNet,
        currentMonthIncome,
        currentMonthExpenses,
        activeAgents,
        pendingReconciliations,
      },
      charts: {
        revenueVsExpensesData,
        spendingCategoriesData: {
          labels: categoryLabels,
          datasets: [
            {
              data: categoryValues,
              backgroundColor: [
                "#3b82f6",
                "#ef4444",
                "#10b981",
                "#f59e0b",
                "#6b7280",
                "#8b5cf6",
                "#ec4899",
                "#14b8a6",
              ],
            },
          ],
        },
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
      recentTransactions: recentTransactions.map((tx: any) => {
        const date = new Date(tx.createdAt);
        const formattedDate = format(date, "MMM dd, yyyy");
        const formattedTime = date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        return {
          datetime: `${formattedDate} ${formattedTime}`,
          agent: tx.recordedBy.name,
          type: tx.type.name,
          category: tx.category || "Uncategorized",
          method: tx.paymentMethod,
          amount: tx.amount,
          status: "Completed",
        };
      }),
      dailyReconciliation,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching owner dashboard data:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
