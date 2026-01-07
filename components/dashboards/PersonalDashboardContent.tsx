"use client";
import React, { useState, useEffect } from "react";
import { User } from "@/lib/types";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  CreditCard,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import KpiCard from "./KpiCard";
import { useOwnerDashboardData } from "@/hooks/useOwnerDashboardData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

const PersonalDashboardContent = (user: User) => {
  const { data, isLoading, error } = useOwnerDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl font-semibold text-foreground animate-pulse">
          Loading Personal Dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl font-semibold text-destructive">
          Error: {error}
        </div>
      </div>
    );
  }

  const { kpis, recentTransactions } = data;

  const hasCategoryData =
    data.charts?.spendingCategoriesData?.labels &&
    data.charts.spendingCategoriesData.labels.length > 0;

  const categoryData = hasCategoryData
    ? data.charts.spendingCategoriesData
    : {
        labels: ["No Data"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["#e5e7eb"],
          },
        ],
      };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Hello, {user.name}!
        </h1>
        <p className="text-muted-foreground mt-1 text-sm italic">
          Managing your personal finances.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Net Balance"
          value={`₦${kpis.totalBalance.toLocaleString()}`}
          description="Cash + Bank Accounts"
          icon={DollarSign}
        />
        <KpiCard
          title="This Month's Spending"
          value={`₦${(kpis.currentMonthExpenses || 0).toLocaleString()}`}
          description="Total expenses recorded"
          icon={TrendingDown}
          valueClassName="text-red-500"
        />
        <KpiCard
          title="This Month's Income"
          value={`₦${(kpis.currentMonthIncome || 0).toLocaleString()}`}
          description="Total deposits recorded"
          icon={TrendingUp}
          valueClassName="text-green-500"
        />
        <KpiCard
          title="Recent Savings"
          value={`₦${((kpis.currentMonthIncome || 0) - (kpis.currentMonthExpenses || 0)).toLocaleString()}`}
          description="Net profit after expenses"
          icon={Wallet}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Spending Chart */}
        <div className="lg:col-span-2 p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary" />
            Spending vs Income Trends
          </h3>
          <div className="h-80">
            <Bar
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top" } },
              }}
              data={{
                labels: data.charts?.revenueVsExpensesData?.labels || [],
                datasets: [
                  {
                    label: "Income",
                    data:
                      data.charts?.revenueVsExpensesData?.datasets[0]?.data ||
                      [],
                    backgroundColor: "rgba(16, 185, 129, 0.6)",
                  },
                  {
                    label: "Expenses",
                    data:
                      data.charts?.revenueVsExpensesData?.datasets[1]?.data ||
                      [],
                    backgroundColor: "rgba(239, 68, 68, 0.6)",
                  },
                ],
              }}
            />
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <PieChartIcon className="w-5 h-5 mr-2 text-primary" />
            Spending Categories
          </h3>
          <div className="h-64 sm:h-80">
            <Pie
              data={categoryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity Mini-Table */}
      <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-primary" />
          Recent Personal Activity
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">description</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentTransactions.slice(0, 5).map((tx: any, i: number) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 italic">{tx.datetime}</td>
                  <td className="px-4 py-3 font-medium">{tx.type}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-muted rounded border text-[10px]">
                      {tx.category || "General"}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${tx.type === "Withdrawal" ? "text-red-500" : "text-green-500"}`}
                  >
                    {tx.type === "Withdrawal" ? "-" : "+"}₦
                    {tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboardContent;
