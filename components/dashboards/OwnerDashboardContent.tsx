"use client";
import { User } from "@/lib/types";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  UserCheck,
  Wallet,
  Building,
  ChevronDown,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import KpiCard from "./KpiCard";
import { Notification } from "@/src/generated/client";
import { GiveCashDialog } from "./agents/GiveCashDialog";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { NotificationBell } from "@/components/NotificationBell";
import { AgentProfitSummary } from "./agents/AgentProfitSummary";
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

const ReconciliationMobileRow = ({ agent }: { agent: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4 bg-card border-b border-border last:border-b-0">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{agent.name}</span>
          <span
            className={cn(
              "text-xs font-semibold",
              agent.difference < 0 ? "text-red-500" : "text-green-500",
            )}
          >
            Difference: ₦{agent.difference.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase flex items-center",
              agent.status === "Reconciled"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800",
            )}
          >
            {agent.status === "Reconciled" ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : (
              <AlertCircle className="w-3 h-3 mr-1" />
            )}
            {agent.status}
          </span>
          <ChevronDown
            className={cn(
              "w-5 h-5 transition-transform text-muted-foreground",
              isOpen ? "rotate-180" : "",
            )}
          />
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-border space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Cash Given:</div>
            <div className="text-right text-foreground font-medium">
              ₦{agent.expected.toLocaleString()}
            </div>
            <div className="text-muted-foreground">Cash in Account:</div>
            <div className="text-right text-foreground font-medium">
              ₦{agent.submitted.toLocaleString()}
            </div>
            <div className="text-muted-foreground">Charges (Profit):</div>
            <div className="text-right text-green-600 dark:text-green-400 font-bold">
              ₦{(agent.charges || 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TransactionDashMobileRow = ({ tx }: { tx: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4 bg-card border-b border-border last:border-b-0">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{tx.type}</span>
          <span className="text-xs text-muted-foreground">
            {tx.agent} • {tx.datetime}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">
            ₦{tx.amount.toLocaleString()}
          </span>
          <ChevronDown
            className={cn(
              "w-5 h-5 transition-transform text-muted-foreground",
              isOpen ? "rotate-180" : "",
            )}
          />
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-border space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Method:</div>
            <div className="text-right text-foreground font-medium capitalize">
              {tx.method}
            </div>
            <div className="text-muted-foreground">Status:</div>
            <div className="text-right">
              <span
                className={cn(
                  "px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase",
                  tx.status === "CONFIRMED" ||
                    tx.status === "SUCCESS" ||
                    tx.status === "Success"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800",
                )}
              >
                {tx.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OwnerDashboardContent = (user: User) => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isGiveCashDialogOpen, setIsGiveCashDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { data, isLoading, error, refresh } = useOwnerDashboardData();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications");
        if (response.ok) {
          const data: Notification[] = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Performance Overview",
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl font-semibold text-foreground animate-pulse">
          Loading...
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

  const { kpis, charts, recentTransactions, dailyReconciliation } = data;
  const totalExpectedCash = dailyReconciliation.reduce(
    (acc: any, agent: any) => acc + agent.expected,
    0,
  );
  const totalSubmittedCash = dailyReconciliation.reduce(
    (acc: any, agent: any) => acc + agent.submitted,
    0,
  );
  const totalCharges = dailyReconciliation.reduce(
    (acc: any, agent: any) => acc + (agent.charges || 0),
    0,
  );
  const difference = totalSubmittedCash - totalExpectedCash;

  const agentProfitData = {
    labels: dailyReconciliation.map((agent: any) => agent.name),
    datasets: [
      {
        label: "Profit",
        data: dailyReconciliation.map((agent: any) => agent.charges || 0),
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(54, 162, 235, 0.5)",
          "rgba(255, 206, 86, 0.5)",
          "rgba(75, 192, 192, 0.5)",
          "rgba(153, 102, 255, 0.5)",
          "rgba(255, 159, 64, 0.5)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-card border-b border-border gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Owner Dashboard
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <NotificationBell />
            <div className="sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGiveCashDialogOpen(true)}
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Cash Given
              </Button>
            </div>
          </div>
          <div className="hidden sm:block">
            <Dialog
              open={isGiveCashDialogOpen}
              onOpenChange={setIsGiveCashDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setIsGiveCashDialogOpen(true)}
                >
                  <PlusCircle className="w-4 h-4 mr-2" /> Cash Given to Agents
                </Button>
              </DialogTrigger>
              <GiveCashDialog
                open={isGiveCashDialogOpen}
                onOpenChange={setIsGiveCashDialogOpen}
                onCashGiven={() => {
                  refresh();
                  setIsGiveCashDialogOpen(false);
                }}
              />
            </Dialog>
          </div>
          <Button className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>
      </header>

      <div className="p-4 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Welcome back, {user.name}!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s your business snapshot.
        </p>

        <div className="mt-6 border-b border-border overflow-x-auto no-scrollbar">
          <nav className="flex -mb-px space-x-2 md:space-x-4 min-w-max">
            <TabButton
              name="Overview"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <TabButton
              name="Reconciliation"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <TabButton
              name="Transactions"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <TabButton
              name="Agent Profit"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </nav>
        </div>

        <div className="mt-8">
          {activeTab === "Overview" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <KpiCard
                    title="Total Balance"
                    value={`₦${kpis.totalBalance.toLocaleString()}`}
                    description="Cash + Bank"
                    icon={DollarSign}
                  />
                  <KpiCard
                    title="Total Cash Float"
                    value={`₦${kpis.cashBalance?.toLocaleString() ?? 0}`}
                    description="Total cash with agents"
                    icon={Wallet}
                  />
                  <KpiCard
                    title="Total Bank Float"
                    value={`₦${kpis.bankBalance?.toLocaleString() ?? 0}`}
                    description="Total bank float with agents"
                    icon={Building}
                  />
                  <KpiCard
                    title="Today's Net"
                    value={`₦${kpis.todaysNet.toLocaleString()}`}
                    description="Revenue - Expenses"
                    icon={Activity}
                  />
                  <KpiCard
                    title="Active Agents"
                    value={kpis.activeAgents}
                    description="Agents active today"
                    icon={UserCheck}
                  />
                  <KpiCard
                    title="Pending Reconciliations"
                    value={kpis.pendingReconciliations}
                    description="Awaiting agent submission"
                    icon={FileCheck}
                  />
                </div>

                <div className="p-4 mt-8 bg-card rounded-lg shadow border border-border">
                  <h3 className="text-lg font-semibold mb-4">
                    Performance Charts
                  </h3>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium text-center mb-2">
                        Revenue vs Expenses
                      </h4>
                      <div className="h-64 sm:h-80">
                        <Bar
                          options={chartOptions}
                          data={charts.revenueVsExpensesData}
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-center mb-2">
                        Agent Profit Distribution
                      </h4>
                      <div className="h-64 sm:h-80">
                        <Doughnut
                          data={agentProfitData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: "bottom" } },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="p-6 bg-card rounded-lg shadow border border-border">
                  <h3 className="text-lg font-semibold pb-4 border-b">
                    Alerts & Notifications
                  </h3>
                  <div className="mt-4 flex flex-col max-h-[500px] overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-4 transition-colors hover:bg-muted/50",
                            !notification.isRead && "bg-primary/5 font-medium",
                          )}
                        >
                          {notification.link ? (
                            <Link href={notification.link} className="block">
                              <p className="text-sm text-foreground">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(
                                  notification.createdAt,
                                ).toLocaleString()}
                              </p>
                            </Link>
                          ) : (
                            <div>
                              <p className="text-sm text-foreground">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(
                                  notification.createdAt,
                                ).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Reconciliation" && (
            <div>
              <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title="Total Cash Given"
                  value={`₦${totalExpectedCash.toLocaleString()}`}
                  icon={TrendingUp}
                />
                <KpiCard
                  title="Total Cash in Account"
                  value={`₦${totalSubmittedCash.toLocaleString()}`}
                  icon={TrendingDown}
                />
                <KpiCard
                  title="Total Charges (Profit)"
                  value={`₦${totalCharges.toLocaleString()}`}
                  icon={DollarSign}
                />
                <KpiCard
                  title="Difference"
                  value={`₦${difference.toLocaleString()}`}
                  icon={difference < 0 ? TrendingDown : TrendingUp}
                  className={difference < 0 ? "text-red-500" : "text-green-500"}
                />
              </div>

              <div className="mt-6 bg-card rounded-lg shadow border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/20">
                  <h4 className="text-md font-semibold font-bold">
                    Agent Reconciliation
                  </h4>
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left text-muted-foreground">
                    <thead className="text-xs text-foreground uppercase bg-muted">
                      <tr className="border-b border-border">
                        <th scope="col" className="px-6 py-3">
                          Agent Name
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Cash Given
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Cash in Account
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Charges (Profit)
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Difference
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyReconciliation.map((agent: any, index: number) => (
                        <tr
                          key={index}
                          className="bg-card border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-foreground">
                            {agent.name}
                          </td>
                          <td className="px-6 py-4">
                            ₦{agent.expected.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            ₦{agent.submitted.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-green-600 dark:text-green-400 font-bold">
                            ₦{(agent.charges || 0).toLocaleString()}
                          </td>
                          <td
                            className={cn(
                              "px-6 py-4 font-medium",
                              agent.difference < 0
                                ? "text-red-500"
                                : "text-green-500",
                            )}
                          >
                            ₦{agent.difference.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "flex items-center text-xs font-medium",
                                agent.status === "Reconciled"
                                  ? "text-green-500"
                                  : "text-yellow-500",
                              )}
                            >
                              {agent.status === "Reconciled" ? (
                                <CheckCircle className="w-4 h-4 mr-1" />
                              ) : (
                                <AlertCircle className="w-4 h-4 mr-1" />
                              )}
                              {agent.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-border">
                  {dailyReconciliation.map((agent: any, index: number) => (
                    <ReconciliationMobileRow key={index} agent={agent} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Transactions" && (
            <div className="mt-6 bg-card rounded-lg shadow border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/20">
                <h4 className="text-md font-semibold font-bold">
                  Recent Transactions
                </h4>
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left text-muted-foreground">
                  <thead className="text-xs text-foreground uppercase bg-muted">
                    <tr className="border-b border-border">
                      <th scope="col" className="px-6 py-3">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Agent
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Method
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx: any, index: number) => (
                      <tr
                        key={index}
                        className="bg-card border-b border-border hover:bg-muted/50 transition-colors text-foreground"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {tx.datetime}
                        </td>
                        <td className="px-6 py-4">{tx.agent}</td>
                        <td className="px-6 py-4">{tx.type}</td>
                        <td className="px-6 py-4 capitalize">{tx.method}</td>
                        <td className="px-6 py-4 font-bold">
                          ₦{tx.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "px-2 py-1 text-[10px] font-semibold rounded-full uppercase",
                              tx.status === "CONFIRMED" ||
                                tx.status === "SUCCESS" ||
                                tx.status === "Success"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800",
                            )}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-border">
                {recentTransactions.map((tx: any, index: number) => (
                  <TransactionDashMobileRow key={index} tx={tx} />
                ))}
              </div>
            </div>
          )}

          {activeTab === "Agent Profit" && (
            <div className="mt-6">
              <AgentProfitSummary />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OwnerDashboardContent;
