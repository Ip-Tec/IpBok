"use client";
import React from "react";
import KpiCard from "@/components/dashboards/KpiCard";
import { DollarSign, Users, TrendingUp, TrendingDown, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";

const OwnerReportsView = () => {
  return (
    <div className="p-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Reports
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            View key metrics and performance overviews.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <DatePickerWithRange />
          <Button>Export</Button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value="₦1,250,000"
          icon={DollarSign}
          change="+12.5%"
          changeType="increase"
        />
        <KpiCard
          title="Total Transactions"
          value="8,430"
          icon={TrendingUp}
          change="+8.1%"
          changeType="increase"
        />
        <KpiCard
          title="Active Agents"
          value="24"
          icon={Users}
          change="-2"
          changeType="decrease"
        />
        <KpiCard
          title="Average Transaction"
          value="₦148.28"
          icon={TrendingDown}
          change="+1.2%"
          changeType="increase"
        />
      </div>

      {/* Charts Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Revenue Over Time</h2>
        <div className="mt-4 p-8 bg-gray-100 rounded-lg shadow dark:bg-gray-800/50 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">[Chart Placeholder]</p>
        </div>
      </div>
      
      {/* Data Table Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Agent Performance</h2>
        <div className="mt-4 bg-white rounded-lg shadow dark:bg-gray-800 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Agent Name</th>
                <th scope="col" className="px-6 py-3">Transactions</th>
                <th scope="col" className="px-6 py-3">Total Volume</th>
                <th scope="col" className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Placeholder Rows */}
              <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <td className="px-6 py-4">Agent 1</td>
                <td className="px-6 py-4">520</td>
                <td className="px-6 py-4">₦150,000</td>
                <td className="px-6 py-4 text-green-500">Active</td>
              </tr>
              <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <td className="px-6 py-4">Agent 2</td>
                <td className="px-6 py-4">480</td>
                <td className="px-6 py-4">₦135,000</td>
                <td className="px-6 py-4 text-green-500">Active</td>
              </tr>
              <tr className="bg-white dark:bg-gray-800">
                <td className="px-6 py-4">Agent 3</td>
                <td className="px-6 py-4">350</td>
                <td className="px-6 py-4">₦95,000</td>
                <td className="px-6 py-4 text-yellow-500">Idle</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OwnerReportsView;
