"use client";
import { User } from "@/lib/types";
import { useState } from "react";
import {
  ArrowRightLeft,
  FileCheck,
  FileText,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Activity,
  UserCheck,
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
import { useOwnerDashboardData } from "@/hooks/useOwnerDashboardData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
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
      "px-4 py-2 text-sm font-medium rounded-md",
      activeTab === name
        ? "bg-indigo-600 text-white"
        : "text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
    )}
  >
    {name}
  </button>
);

const OwnerDashboardContent = (user: User) => {
  const [activeTab, setActiveTab] = useState("Overview");
  const { data, isLoading, error } = useOwnerDashboardData();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Chart.js Bar Chart",
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold text-red-500">
          Error: {error}
        </div>
      </div>
    );
  }

  const { kpis, charts, recentTransactions, dailyReconciliation } = data;
  const totalExpectedCash = dailyReconciliation.reduce(
    (acc: any, agent: any) => acc + agent.expected,
    0
  );
  const totalSubmittedCash = dailyReconciliation.reduce(
    (acc: any, agent: any) => acc + agent.submitted,
    0
  );
  const difference = totalSubmittedCash - totalExpectedCash;

  return (
    <>
      <header className="flex items-center justify-between p-4 bg-white border-b dark:bg-gray-800 dark:border-gray-700">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          Owner Dashboard
        </h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Transaction
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>
      </header>

      <div className="p-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          Welcome back, {user.name}!
        </h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Here&apos;s your business snapshot.
        </p>

        <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px space-x-4">
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
          </nav>
        </div>

        <div className="mt-8">
          {activeTab === "Overview" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <KpiCard
                    title="Total Balance"
                    value={`₦${kpis.totalBalance.toLocaleString()}`}
                    description="Cash + Bank"
                    icon={DollarSign}
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

                <div className="p-4 mt-8 bg-white rounded-lg shadow dark:bg-gray-800">
                  <h3 className="text-lg font-semibold">Charts</h3>
                  <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="text-md font-semibold text-center">
                        Revenue vs Expenses
                      </h4>
                      <div className="h-64">
                        <Bar
                          options={chartOptions}
                          data={charts.revenueVsExpensesData}
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-semibold text-center">
                        Cash vs Bank Ratio
                      </h4>
                      <div className="h-64">
                        <Doughnut data={charts.cashVsBankData} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                  <h3 className="text-lg font-semibold">
                    Alerts & Notifications
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li className="flex">
                      <AlertCircle className="flex-shrink-0 w-5 h-5 mt-1 text-yellow-500" />
                      <div className="ml-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Feature coming soon
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          now
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Reconciliation" && (
            <div>
              <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-3">
                <KpiCard
                  title="Total Expected Cash"
                  value={`₦${totalExpectedCash.toLocaleString()}`}
                  icon={TrendingUp}
                />
                <KpiCard
                  title="Total Submitted Cash"
                  value={`₦${totalSubmittedCash.toLocaleString()}`}
                  icon={TrendingDown}
                />
                <KpiCard
                  title="Difference"
                  value={`₦${difference.toLocaleString()}`}
                  icon={DollarSign}
                />
              </div>

              <div className="mt-4 bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="p-4">
                  <h4 className="text-md font-semibold">
                    Agent Reconciliation
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                      <tr>
                        <th scope="col" className="px-6 py-3">
                          Agent Name
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Expected Amount
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Submitted Amount
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
                          className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                        >
                          <td className="px-6 py-4">{agent.name}</td>
                          <td className="px-6 py-4">
                            ₦{agent.expected.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            ₦{agent.submitted.toLocaleString()}
                          </td>
                          <td
                            className={cn(
                              "px-6 py-4",
                              agent.difference < 0
                                ? "text-red-500"
                                : "text-green-500"
                            )}
                          >
                            ₦{agent.difference.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "flex items-center",
                                agent.status === "Reconciled"
                                  ? "text-green-500"
                                  : "text-yellow-500"
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
              </div>
            </div>
          )}

          {activeTab === "Transactions" && (
            <div className="mt-4 bg-white rounded-lg shadow dark:bg-gray-800">
              <div className="p-4">
                <h4 className="text-md font-semibold">Recent Transactions</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
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
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                      >
                        <td className="px-6 py-4">{tx.datetime}</td>
                        <td className="px-6 py-4">{tx.agent}</td>
                        <td className="px-6 py-4">{tx.type}</td>
                        <td className="px-6 py-4">{tx.method}</td>
                        <td className="px-6 py-4">
                          ₦{tx.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">{tx.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OwnerDashboardContent;
