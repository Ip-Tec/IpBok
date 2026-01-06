"use client";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  AlertCircle,
  ChevronDown,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import KpiCard from "@/components/dashboards/KpiCard";

// Define the types for our data structure
interface AgentReconciliation {
  name: string;
  expected: number;
  submitted: number;
  difference: number;
  status: "Reconciled" | "Pending";
}

interface DailyReconciliationData {
  totalExpectedCash: number;
  totalSubmittedCash: number;
  difference: number;
  agents: AgentReconciliation[];
}

const ReconciliationMobileRow = ({ agent }: { agent: AgentReconciliation }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 dark:text-white">
            {agent.name}
          </span>
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
              "w-5 h-5 transition-transform text-gray-400",
              isOpen ? "rotate-180" : "",
            )}
          />
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500">Expected Amount:</div>
            <div className="text-right text-gray-900 dark:text-white font-medium">
              ₦{agent.expected.toLocaleString()}
            </div>
            <div className="text-gray-500">Submitted Amount:</div>
            <div className="text-right text-gray-900 dark:text-white font-medium">
              ₦{agent.submitted.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OwnerReconciliationView = () => {
  const [data, setData] = useState<DailyReconciliationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/reconciliation");
        if (!response.ok) {
          throw new Error("Failed to fetch reconciliation data.");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg font-medium text-muted-foreground animate-pulse">
          Loading reconciliation data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p className="text-lg font-semibold">Error loading data</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No reconciliation data available for today.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <header className="pb-4 border-b">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Daily Reconciliation
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Monitor the reconciliation status of all agents.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Total Expected Cash"
          value={`₦${data.totalExpectedCash.toLocaleString()}`}
          icon={TrendingUp}
        />
        <KpiCard
          title="Total Submitted Cash"
          value={`₦${data.totalSubmittedCash.toLocaleString()}`}
          icon={TrendingDown}
        />
        <KpiCard
          title="Difference"
          value={`₦${data.difference.toLocaleString()}`}
          icon={DollarSign}
          className={data.difference < 0 ? "text-red-500" : "text-green-500"}
        />
      </div>

      <div className="mt-8 bg-white rounded-lg shadow dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
          <h2 className="text-lg font-semibold">Agent Reconciliation Status</h2>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
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
              {data.agents.map((agent, index) => (
                <tr
                  key={index}
                  className="bg-white border-b last:border-b-0 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {agent.name}
                  </td>
                  <td className="px-6 py-4">
                    ₦{agent.expected.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    ₦{agent.submitted.toLocaleString()}
                  </td>
                  <td
                    className={cn(
                      "px-6 py-4 font-semibold",
                      agent.difference < 0 ? "text-red-500" : "text-green-500",
                    )}
                  >
                    ₦{agent.difference.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "flex items-center text-xs font-semibold",
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
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {data.agents.map((agent, index) => (
            <ReconciliationMobileRow key={index} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OwnerReconciliationView;
