"use client";
import React from "react";
import { AgentTaskStatus } from "@/lib/types";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface AgentDailyTaskStatusProps {
  status: AgentTaskStatus;
}

const AgentDailyTaskStatus: React.FC<AgentDailyTaskStatusProps> = ({
  status,
}) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Daily Task Status</h3>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          {status.loggedIn ? (
            <CheckCircle className="text-green-500" />
          ) : (
            <XCircle className="text-red-500" />
          )}
          <span className="text-gray-700 dark:text-gray-300">Logged In</span>
        </div>
        <div className="flex items-center space-x-2">
          {status.transactionsRecorded ? (
            <CheckCircle className="text-green-500" />
          ) : (
            <XCircle className="text-red-500" />
          )}
          <span className="text-gray-700 dark:text-gray-300">
            Transactions Recorded
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {status.reconciliationPending ? (
            <AlertTriangle className="text-yellow-500" />
          ) : (
            <CheckCircle className="text-green-500" />
          )}
          <span className="text-gray-700 dark:text-gray-300">
            Reconciliation Pending
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {status.reconciled ? (
            <CheckCircle className="text-green-500" />
          ) : (
            <XCircle className="text-red-500" />
          )}
          <span className="text-gray-700 dark:text-gray-300">Reconciled</span>
        </div>
      </div>
    </div>
  );
};

export default AgentDailyTaskStatus;
