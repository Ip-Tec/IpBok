"use client";
import React from "react";
import {
  DollarSign,
  Wallet,
  Banknote,
  FileCheck,
  History,
} from "lucide-react";
import { AgentSummaryCards } from "@/lib/types";
import KpiCard from "../../components/dashboards/KpiCard";

interface AgentSummaryCardsProps {
  summary: AgentSummaryCards;
}

const AgentSummaryCardsComponent: React.FC<AgentSummaryCardsProps> = ({
  summary,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Today's Total Collected"
        value={`₦${summary.todayTotalCollected.toFixed(2)}`}
        icon={DollarSign}
      />
      <KpiCard
        title="Cash Collected Today"
        value={`₦${summary.cashCollectedToday.toFixed(2)}`}
        icon={Wallet}
      />
      <KpiCard
        title="Bank Collected Today"
        value={`₦${summary.bankCollectedToday.toFixed(2)}`}
        icon={Banknote}
      />
      <KpiCard
        title="Pending Reconciliation Status"
        value={summary.pendingReconciliationStatus}
        icon={FileCheck}
      />
      {summary.yesterdayBalance !== undefined && (
        <KpiCard
          title="Yesterday's Balance"
          value={`₦${summary.yesterdayBalance.toFixed(2)}`}
          icon={History}
        />
      )}
    </div>
  );
};

export default AgentSummaryCardsComponent;
