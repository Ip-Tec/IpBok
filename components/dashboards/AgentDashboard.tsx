"use client";
import { User } from "@/lib/types";
import React, { useState } from "react";
import {
  LayoutDashboard,
  ArrowRightLeft,
  FileCheck,
  Settings,
  Menu,
} from "lucide-react";
import SideNav from "./SideNav";
import KpiCard from "./KpiCard";

const AgentDashboard = (user: User) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sidebarNavLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
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
      name: "Setting",
      href: "/dashboard/settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

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
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            This is your agent dashboard. Here you can manage your transactions.
          </p>

          <div className="mt-8">
            <h3 className="text-lg font-semibold">Agent & Operations KPIs</h3>
            <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Total Agents" value="50" />
              <KpiCard title="Active Agents (Today)" value="45" />
              <KpiCard title="Total Transactions Today" value="320" />
              <KpiCard title="Pending Reconciliations" value="15" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AgentDashboard;
