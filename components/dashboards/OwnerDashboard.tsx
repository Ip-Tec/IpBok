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
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import SideNav from "./SideNav";
import KpiCard from "./KpiCard";

const OwnerDashboard = (user: User) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("Today");

  const sidebarNavLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Agents",
      href: "/dashboard/agents",
      icon: <Users className="w-5 h-5" />,
    },
    {
      name: "Transaction",
      href: "/dashboard/transactions",
      icon: <ArrowRightLeft className="w-5 h-5" />,
    },
    {
      name: "Reconciliation",
      href: "/dashboard/reconciliation",
      icon: <FileCheck className="w-5 h-5" />,
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      name: "Setting",
      href: "/dashboard/settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const kpiData = {
    Today: {
      revenue: 5000,
      expenses: 1200,
    },
    "This Week": {
      revenue: 25000,
      expenses: 8000,
    },
    "This Month": {
      revenue: 125000,
      expenses: 45000,
    },
  };

  const totalBalance = 250000; // Cash + Bank
  const { revenue, expenses } = kpiData[selectedPeriod];
  const netBalance = revenue - expenses;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <SideNav
        user={user}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sidebarNavLinks={sidebarNavLinks}
      />

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        <header className="flex items-center justify-between p-4 bg-white border-b dark:bg-gray-800 dark:border-gray-700">
          <button
            className="p-2 text-gray-500 rounded-md lg:hidden hover:text-gray-600 focus:outline-none focus:ring"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Dashboard
          </h1>
        </header>
        <div className="p-8">
          <h2 className="text-2xl font-bold">Welcome, {user.name}!</h2>
          <div className="mt-8">
            <div className="flex items-center justify-end mb-4">
              <div className="flex items-center space-x-2">
                {Object.keys(kpiData).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={cn(
                      "px-3 py-1 text-sm font-medium rounded-md",
                      selectedPeriod === period
                        ? "bg-gray-800 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    )}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Total Balance"
                value={`$${totalBalance.toLocaleString()}`}
                description="Cash + Bank"
              />
              <KpiCard
                title={`${selectedPeriod}'s Revenue`}
                value={`$${revenue.toLocaleString()}`}
              />
              <KpiCard
                title={`${selectedPeriod}'s Expenses`}
                value={`$${expenses.toLocaleString()}`}
              />
              <KpiCard
                title={`Net Balance ${selectedPeriod}`}
                value={`$${netBalance.toLocaleString()}`}
                description="Revenue - Expenses"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboard;