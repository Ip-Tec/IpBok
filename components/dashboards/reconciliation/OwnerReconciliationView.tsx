"use client";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle } from "lucide-react";
import KpiCard from "@/components/dashboards/KpiCard";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

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
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center flex justify-center items-center">
        <p>Loading reconciliation data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="p-8 text-center">
        <p>No reconciliation data available.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="pb-4 border-b">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Daily Reconciliation
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Monitor the reconciliation status of all agents.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 mt-6 sm:grid-cols-3">
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
        />
      </div>

      <div className="mt-8 bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="p-4">
          <h2 className="text-lg font-semibold">Agent Reconciliation Status</h2>
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
              {data.agents.map((agent, index) => (
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
                      agent.difference < 0 ? "text-red-500 dark:text-red-400" : "text-green-500 dark:text-green-400"
                    )}
                  >
                    ₦{agent.difference.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "flex items-center",
                        agent.status === "Reconciled"
                          ? "text-green-500 dark:text-green-400"
                          : "text-yellow-500 dark:text-yellow-400"
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
  );
};

export default OwnerReconciliationView;
