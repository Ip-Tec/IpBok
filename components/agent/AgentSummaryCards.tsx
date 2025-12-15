"use client";
import React from "react";
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
        value={`$${summary.todayTotalCollected.toFixed(2)}`}
      />
      <KpiCard
        title="Cash Collected Today"
        value={`$${summary.cashCollectedToday.toFixed(2)}`}
      />
      <KpiCard
        title="Bank Collected Today"
        value={`$${summary.bankCollectedToday.toFixed(2)}`}
      />
      <KpiCard
        title="Pending Reconciliation Status"
        value={summary.pendingReconciliationStatus}
      />
      {summary.yesterdayBalance !== undefined && (
        <KpiCard
          title="Yesterday's Balance"
          value={`$${summary.yesterdayBalance.toFixed(2)}`}
        />
      )}
    </div>
  );
};

export default AgentSummaryCardsComponent;
