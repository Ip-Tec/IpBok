export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const businessId = session.user.businessId;

  try {
    // 1. Fetch Income (Deposit + Income) and Expenses (Withdrawal + Expense)
    // We aggregate directly by checking type names to handle legacy data mixed with new data

    const incomeTransactions = await prisma.transaction.aggregate({
      where: {
        businessId,
        type: { name: { in: ["Deposit", "Income"] } },
      },
      _sum: { amount: true },
    });

    const expenseTransactions = await prisma.transaction.aggregate({
      where: {
        businessId,
        type: { name: { in: ["Withdrawal", "Expense"] } },
      },
      _sum: { amount: true },
    });

    const totalIncome = incomeTransactions._sum.amount || 0;
    const totalExpenses = expenseTransactions._sum.amount || 0;
    const netProfit = totalIncome - totalExpenses;

    // Fetch recent transactions (limit 10)
    const recentTx = await prisma.transaction.findMany({
      where: {
        businessId,
        type: {
          name: { in: ["Deposit", "Income", "Withdrawal", "Expense"] },
        },
      },
      include: {
        type: true,
        recordedBy: { select: { name: true, email: true } },
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    // Format recent transactions
    const recentTransactionsFormatted = recentTx.map((tx: any) => ({
      id: tx.id,
      date: format(new Date(tx.date), "MMM dd, yyyy HH:mm"),
      description: tx.description,
      type:
        tx.type.name === "Deposit" || tx.type.name === "Income"
          ? "Income"
          : "Expense", // UI Mapping
      amount: tx.amount,
      recordedBy: tx.recordedBy?.name || tx.recordedBy?.email || "Unknown",
    }));

    // 4. Calculate Chart Data (Revenue vs Expenses for last 6 months)
    const months: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    // Generate last 6 months labels
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(format(d, "MMM"));
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const chartTransactions = await prisma.transaction.findMany({
      where: {
        businessId,
        date: { gte: sixMonthsAgo },
        type: {
          name: { in: ["Deposit", "Income", "Withdrawal", "Expense"] },
        },
      },
      include: { type: true },
    });

    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};

    chartTransactions.forEach((tx: any) => {
      const monthKey = format(new Date(tx.date), "MMM");
      if (tx.type.name === "Deposit" || tx.type.name === "Income") {
        incomeMap[monthKey] = (incomeMap[monthKey] || 0) + tx.amount;
      } else if (tx.type.name === "Withdrawal" || tx.type.name === "Expense") {
        expenseMap[monthKey] = (expenseMap[monthKey] || 0) + tx.amount;
      }
    });

    // Populate data arrays based on labels
    months.forEach((m) => {
      incomeData.push(incomeMap[m] || 0);
      expenseData.push(expenseMap[m] || 0);
    });

    return NextResponse.json({
      kpis: {
        totalIncome,
        totalExpenses,
        netProfit,
        cashFlow: netProfit,
      },
      recentTransactions: recentTransactionsFormatted,
      charts: {
        labels: months,
        datasets: [
          {
            label: "Income",
            data: incomeData,
            backgroundColor: "rgba(16, 185, 129, 0.5)", // Green for Income
          },
          {
            label: "Expenses",
            data: expenseData,
            backgroundColor: "rgba(239, 68, 68, 0.5)", // Red for Expenses
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching accounting data:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
