"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

import KpiCard from "@/components/dashboards/KpiCard";
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { cn } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

// Helper function to fetch report data
const getReportData = async (dateRange?: DateRange) => {
  const params = new URLSearchParams();
  if (dateRange?.from) {
    params.append("startDate", format(dateRange.from, "yyyy-MM-dd"));
  }
  if (dateRange?.to) {
    params.append("endDate", format(dateRange.to, "yyyy-MM-dd"));
  }

  const res = await fetch(`/api/reports?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch report data");
  }
  return res.json();
};

const PerformanceMobileRow = ({
  agent,
  formatCurrency,
}: {
  agent: any;
  formatCurrency: (v: number) => string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4 bg-white dark:bg-gray-800">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 dark:text-white">
            {agent.agentName}
          </span>
          <span className="text-sm text-gray-500">
            {agent.transactions.toLocaleString()} Transactions
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">
            {formatCurrency(agent.totalVolume)}
          </span>
          <ChevronDown
            className={cn(
              "w-5 h-5 transition-transform text-gray-400",
              isOpen ? "rotate-180" : "",
            )}
          />
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500">Status:</div>
            <div className="text-right text-green-500 dark:text-green-400 font-medium">
              {agent.status}
            </div>
            <div className="text-gray-500">Avg. Vol/Tx:</div>
            <div className="text-right text-gray-900 dark:text-white">
              {formatCurrency(agent.totalVolume / agent.transactions)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OwnerReportsView = () => {
  const [date, setDate] = useState<DateRange | undefined>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports", date],
    queryFn: () => getReportData(date),
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(value);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (date?.from) {
      params.append("startDate", format(date.from, "yyyy-MM-dd"));
    }
    if (date?.to) {
      params.append("endDate", format(date.to, "yyyy-MM-dd"));
    }
    window.open(`/api/reports/export?${params.toString()}`, "_blank");
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Daily Revenue",
      },
    },
  };

  const chartData = {
    labels: data?.revenueOverTime?.map((d: any) => d.date) || [],
    datasets: [
      {
        label: "Revenue",
        data: data?.revenueOverTime?.map((d: any) => d.revenue) || [],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
    ],
  };

  if (error) {
    return (
      <div className="p-8 text-red-500">Error: {(error as Error).message}</div>
    );
  }

  return (
    <div className="w-full p-4 md:p-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View key metrics and performance overviews.
          </p>
        </div>
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 md:mt-0">
          <DatePickerWithRange date={date} onDateChange={setDate} />
          <Button onClick={handleExport} className="w-full sm:w-auto">
            Export
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <KpiCard
          title="Total Revenue"
          value={isLoading ? "..." : formatCurrency(data?.totalRevenue || 0)}
          icon={DollarSign}
        />
        <KpiCard
          title="Total Transactions"
          value={
            isLoading ? "..." : (data?.totalTransactions || 0).toLocaleString()
          }
          icon={TrendingUp}
        />
        <KpiCard
          title="Active Agents"
          value={isLoading ? "..." : data?.activeAgents || 0}
          icon={Users}
        />
        <KpiCard
          title="Average Transaction"
          value={
            isLoading ? "..." : formatCurrency(data?.averageTransaction || 0)
          }
          icon={TrendingDown}
        />
      </div>

      {/* Charts Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold px-2">Revenue Over Time</h2>
        <div className="mt-4 p-4 bg-white rounded-lg shadow dark:bg-gray-800 h-[300px] md:h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">
                Loading Chart...
              </p>
            </div>
          ) : (
            <Line options={chartOptions} data={chartData} />
          )}
        </div>
      </div>

      {/* Data Table Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold px-2">Agent Performance</h2>
        <div className="mt-4 bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Agent Name
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Transactions
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Total Volume
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  data?.agentPerformance?.map((agent: any) => (
                    <tr
                      key={agent.agentId}
                      className="bg-white border-b last:border-b-0 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {agent.agentName}
                      </td>
                      <td className="px-6 py-4">
                        {agent.transactions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(agent.totalVolume)}
                      </td>
                      <td className="px-6 py-4 font-medium text-green-500 dark:text-green-400">
                        {agent.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              <div className="p-6 text-center">Loading...</div>
            ) : (
              data?.agentPerformance?.map((agent: any) => (
                <PerformanceMobileRow
                  key={agent.agentId}
                  agent={agent}
                  formatCurrency={formatCurrency}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerReportsView;
