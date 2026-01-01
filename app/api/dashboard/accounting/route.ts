import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const businessId = session.user.businessId;

  try {
    // 1. Fetch Income and Expenses
    // We assume TransactionType names are "Income" and "Expense"
    // We need to find their IDs first, or join.
    
    // Let's get the type IDs
    const incomeType = await prisma.transactionType.findUnique({ where: { name: "Income" } });
    const expenseType = await prisma.transactionType.findUnique({ where: { name: "Expense" } });

    // Fetch transactions
    const incomeTransactions = incomeType ? await prisma.transaction.aggregate({
        where: {
            businessId,
            typeId: incomeType.id
        },
        _sum: { amount: true }
    }) : { _sum: { amount: 0 } };

    const expenseTransactions = expenseType ? await prisma.transaction.aggregate({
        where: {
            businessId,
            typeId: expenseType.id
        },
        _sum: { amount: true }
    }) : { _sum: { amount: 0 } };

    const totalIncome = incomeTransactions._sum.amount || 0;
    const totalExpenses = expenseTransactions._sum.amount || 0;
    const netProfit = totalIncome - totalExpenses;

    // Fetch recent transactions (limit 10)
    const recentTx = await prisma.transaction.findMany({
        where: {
            businessId,
            typeId: { in: [incomeType?.id || "", expenseType?.id || ""] }
        },
        include: {
            type: true,
            recordedBy: { select: { name: true, email: true } }
        },
        orderBy: { date: 'desc' },
        take: 10
    });

    // Format recent transactions
    const recentTransactionsFormatted = recentTx.map(tx => ({
        id: tx.id,
        date: format(new Date(tx.date), "MMM dd, yyyy HH:mm"),
        description: tx.description,
        type: tx.type.name,
        amount: tx.amount,
        recordedBy: tx.recordedBy?.name || tx.recordedBy?.email || "Unknown"
    }));

    // 4. Calculate Chart Data (Revenue vs Expenses for last 6 months)
    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    // Generate last 6 months labels
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(format(d, "MMM"));
    }

    // Advanced: To do this properly with Prisma across months usually requires Raw SQL or grouping by date on application side if volume is low.
    // For MVP/Low Volume: Fetch all transactions for last 6 months and reduce.
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const chartTransactions = await prisma.transaction.findMany({
        where: {
            businessId,
            date: { gte: sixMonthsAgo },
            typeId: { in: [incomeType?.id || "", expenseType?.id || ""] }
        },
        include: { type: true }
    });

    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};

    chartTransactions.forEach(tx => {
        const monthKey = format(new Date(tx.date), "MMM");
        if (tx.type.name === 'Income') {
            incomeMap[monthKey] = (incomeMap[monthKey] || 0) + tx.amount;
        } else if (tx.type.name === 'Expense') {
            expenseMap[monthKey] = (expenseMap[monthKey] || 0) + tx.amount;
        }
    });

    // Populate data arrays based on labels
    months.forEach(m => {
        incomeData.push(incomeMap[m] || 0);
        expenseData.push(expenseMap[m] || 0);
    });

    return NextResponse.json({
        kpis: {
            totalIncome,
            totalExpenses,
            netProfit,
            cashFlow: netProfit
        },
        recentTransactions: recentTransactionsFormatted,
        charts: {
            labels: months,
            datasets: [
              {
                label: "Income",
                data: incomeData,
                backgroundColor: "rgba(75, 192, 192, 0.5)",
              },
              {
                label: "Expenses",
                data: expenseData,
                backgroundColor: "rgba(255, 99, 132, 0.5)",
              },
            ],
        }
    });

  } catch (error) {
    console.error("Error fetching accounting data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
