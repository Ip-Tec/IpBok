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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          {status.loggedIn ? (
            <CheckCircle className="text-green-500" />
          ) : (
            <XCircle className="text-red-500" />
          )}
          <span className="text-card-foreground">Logged In</span>
        </div>
        <div className="flex items-center space-x-2">
          {status.transactionsRecorded ? (
            <CheckCircle className="text-green-500" />
          ) : (
            <XCircle className="text-red-500" />
          )}
          <span className="text-card-foreground">Transactions Recorded</span>
        </div>
        <div className="flex items-center space-x-2">
          {status.reconciliationPending ? (
            <AlertTriangle className="text-yellow-500" />
          ) : (
            <CheckCircle className="text-green-500" />
          )}
          <span className="text-card-foreground">Reconciliation Pending</span>
        </div>
        <div className="flex items-center space-x-2">
          {status.reconciled ? (
            <CheckCircle className="text-green-500" />
          ) : (
            <XCircle className="text-red-500" />
          )}
          <span className="text-card-foreground">Reconciled</span>
        </div>
      </div>
    </div>
  );
};

export default AgentDailyTaskStatus;
