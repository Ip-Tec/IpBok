"use client";
import { User } from "@/lib/types";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  FileCheck,
  FileText,
  Settings,
  Menu,
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
  ChartOptions
} from "chart.js";

import SideNav from "./SideNav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// New KpiCard component
const KpiCard = ({
  title,
  value,
  description,
  icon: Icon,
  change,
  changeType,
}: any) => (
  <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
    <div className="flex items-center">
      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
        <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="text-xl font-bold text-gray-800 dark:text-white">
          {value}
        </p>
      </div>
    </div>
    {description && (
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    )}
    {change && (
      <div className="flex items-center mt-2">
        <span
          className={cn(
            "flex items-center text-sm font-medium",
            changeType === "increase" ? "text-green-500" : "text-red-500"
          )}
        >
          {changeType === "increase" ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
          {change}
        </span>
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          vs last period
        </span>
      </div>
    )}
  </div>
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

const OwnerDashboard = (user: User) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

  const sidebarNavLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-6 h-6" />,
    },
    {
      name: "Agents",
      href: "/dashboard/agents",
      icon: <Users className="w-6 h-6" />,
    },
    {
      name: "Transaction",
      href: "/dashboard/transactions",
      icon: <ArrowRightLeft className="w-6 h-6" />,
    },
    {
      name: "Reconciliation",
      href: "/dashboard/reconciliation",
      icon: <FileCheck className="w-6 h-6" />,
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      name: "Setting",
      href: "/dashboard/settings",
      icon: <Settings className="w-6 h-6" />,
    },
  ];

  const chartOptions: ChartOptions<"bar"> = {
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

  const dailyReconciliation = {
    totalExpectedCash: 40000,
    totalSubmittedCash: 38000,
    difference: -2000,
    agents: [
      {
        name: "Agent 1",
        expected: 10000,
        submitted: 10000,
        difference: 0,
        status: "Reconciled",
      },
      {
        name: "Agent 2",
        expected: 15000,
        submitted: 14000,
        difference: -1000,
        status: "Pending",
      },
      {
        name: "Agent 3",
        expected: 5000,
        submitted: 5000,
        difference: 0,
        status: "Reconciled",
      },
      {
        name: "Agent 4",
        expected: 10000,
        submitted: 9000,
        difference: -1000,
        status: "Pending",
      },
    ],
  };

  const recentTransactions = [
    {
      datetime: "2025-12-14 10:30",
      agent: "Agent 1",
      type: "Deposit",
      method: "Cash",
      amount: 500,
      status: "Completed",
    },
    {
      datetime: "2025-12-14 10:35",
      agent: "Agent 2",
      type: "Withdrawal",
      method: "Bank",
      amount: 200,
      status: "Completed",
    },
    {
      datetime: "2025-12-14 10:40",
      agent: "Agent 1",
      type: "Expense",
      method: "Cash",
      amount: 50,
      status: "Completed",
    },
  ];

  const alerts = [
    { text: "Agent 4 hasn't reconciled today", time: "2h ago" },
    { text: "Cash shortfall of $2,000 detected", time: "3h ago" },
    { text: "Large expense of $500 added by Agent 3", time: "5h ago" },
    { text: "Agent 5 was added to the system", time: "1d ago" },
  ];

  const revenueVsExpensesData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Revenue",
        data: [1200, 1900, 3000, 5000, 2300, 3100, 4000],
        backgroundColor: "rgba(101, 116, 205, 0.8)",
      },
      {
        label: "Expenses",
        data: [800, 1200, 1800, 2500, 1500, 1900, 2200],
        backgroundColor: "rgba(255, 107, 107, 0.8)",
      },
    ],
  };

  const cashVsBankData = {
    labels: ["Cash", "Bank"],
    datasets: [
      {
        data: [100000, 150000],
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
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <SideNav
        user={user}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sidebarNavLinks={sidebarNavLinks}
      />

      <main className="flex-1 overflow-y-auto lg:ml-64">
        <header className="flex items-center justify-between p-4 bg-white border-b dark:bg-gray-800 dark:border-gray-700">
          <button
            className="p-2 text-gray-500 rounded-md lg:hidden hover:text-gray-600 focus:outline-none focus:ring"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
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
                      value="₦250,000"
                      description="Cash + Bank"
                      icon={DollarSign}
                      change="5.4%"
                      changeType="increase"
                    />
                    <KpiCard
                      title="Today's Net"
                      value="₦3,800"
                      description="Revenue - Expenses"
                      icon={Activity}
                      change="2.1%"
                      changeType="increase"
                    />
                    <KpiCard
                      title="Active Agents"
                      value="45 / 50"
                      description="Agents active today"
                      icon={UserCheck}
                      change="1"
                      changeType="increase"
                    />
                    <KpiCard
                      title="Pending Reconciliations"
                      value="5"
                      description="Awaiting agent submission"
                      icon={FileCheck}
                      change="2"
                      changeType="decrease"
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
                            data={revenueVsExpensesData}
                          />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-md font-semibold text-center">
                          Cash vs Bank Ratio
                        </h4>
                        <div className="h-64">
                          <Doughnut data={cashVsBankData} />
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
                      {alerts.map((alert, index) => (
                        <li key={index} className="flex">
                          <AlertCircle className="flex-shrink-0 w-5 h-5 mt-1 text-yellow-500" />
                          <div className="ml-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {alert.text}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {alert.time}
                            </p>
                          </div>
                        </li>
                      ))}
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
                    value={`₦${dailyReconciliation.totalExpectedCash.toLocaleString()}`}
                    icon={TrendingUp}
                  />
                  <KpiCard
                    title="Total Submitted Cash"
                    value={`₦${dailyReconciliation.totalSubmittedCash.toLocaleString()}`}
                    icon={TrendingDown}
                  />
                  <KpiCard
                    title="Difference"
                    value={`₦${dailyReconciliation.difference.toLocaleString()}`}
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
                        {dailyReconciliation.agents.map((agent, index) => (
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
                      {recentTransactions.map((tx, index) => (
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
      </main>
    </div>
  );
};

export default OwnerDashboard;
