"use client";

import { User } from "@/lib/types";
import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  PlusCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import KpiCard from "./KpiCard";
import { RecordTransactionDialog } from "./accounting/RecordTransactionDialog";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Bar, Doughnut } from "react-chartjs-2";
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
import { useAccountingDashboardData } from "@/hooks/useAccountingDashboardData";
import { cn } from "@/lib/utils";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

interface TabButtonProps {
  name: string;
  activeTab: string;
  setActiveTab: (tabName: string) => void;
}

const TabButton = ({ name, activeTab, setActiveTab }: TabButtonProps) => (
  <button
    onClick={() => setActiveTab(name)}
    className={cn(
      "px-4 py-2 text-sm font-medium rounded-md transition-colors",
      activeTab === name
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    )}
  >
    {name}
  </button>
);

const AccountingDashboardContent = (user: User) => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const { data, isLoading, error, refresh } = useAccountingDashboardData();

  if (isLoading) return <div className="p-8">Loading financial data...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  const { kpis, recentTransactions } = data;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Income vs Expenses" },
    },
  };

  const revenueVsExpensesData = data.charts || {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Income",
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
      {
        label: "Expenses",
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  return (
    <>
      <header className="flex items-center justify-between p-4 bg-card border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">
          {user.businessType === "PERSONAL"
            ? "Personal Accounts"
            : "Accounting Dashboard"}
        </h1>
        <div className="flex items-center space-x-2">
          <RecordTransactionDialog
            open={isIncomeDialogOpen}
            onOpenChange={setIsIncomeDialogOpen}
            type="Income"
            onSuccess={refresh}
          />
          <RecordTransactionDialog
            open={isExpenseDialogOpen}
            onOpenChange={setIsExpenseDialogOpen}
            type="Expense"
            onSuccess={refresh}
          />
          <Button variant="outline" onClick={() => setIsIncomeDialogOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" /> Record Income
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsExpenseDialogOpen(true)}
          >
            <PlusCircle className="w-4 h-4 mr-2" /> Record Expense
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </header>

      <div className="p-8">
        <h2 className="text-3xl font-bold text-foreground">
          {user.businessType === "PERSONAL"
            ? "Financial Health"
            : "Financial Overview"}
        </h2>
        <p className="mt-1 text-muted-foreground">
          {user.businessType === "PERSONAL"
            ? "Track your personal money flow."
            : "Track your business performance."}
        </p>

        <div className="mt-6 border-b border-border">
          <nav className="flex -mb-px space-x-4">
            <TabButton
              name="Overview"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <TabButton
              name="Income"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <TabButton
              name="Expenses"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <TabButton
              name="Reports"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </nav>
        </div>

        <div className="mt-8">
          {activeTab === "Overview" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <KpiCard
                    title="Total Income"
                    value={`₦${kpis.totalIncome.toLocaleString()}`}
                    icon={TrendingUp}
                    changeType="increase"
                  />
                  <KpiCard
                    title="Total Expenses"
                    value={`₦${kpis.totalExpenses.toLocaleString()}`}
                    icon={TrendingDown}
                    changeType="decrease"
                  />
                  <KpiCard
                    title="Net Profit"
                    value={`₦${kpis.netProfit.toLocaleString()}`}
                    icon={DollarSign}
                    changeType="increase"
                  />
                  <KpiCard
                    title="Cash Flow"
                    value={`₦${kpis.cashFlow.toLocaleString()}`}
                    icon={Activity}
                  />
                </div>

                <div className="p-4 mt-8 bg-card rounded-lg shadow border border-border">
                  <h3 className="text-lg font-semibold">Cash Flow</h3>
                  <div className="mt-4 h-80">
                    <Bar options={chartOptions} data={revenueVsExpensesData} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Add other tabs placeholders */}
          {activeTab === "Income" && <div>Income Table Component here</div>}
          {activeTab === "Expenses" && <div>Expenses Table Component here</div>}
        </div>
      </div>
    </>
  );
};

export default AccountingDashboardContent;
