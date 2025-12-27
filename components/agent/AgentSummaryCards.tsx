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

const AgentSummaryCardsComponent: React.FC<AgentSummaryCardsProps> = ({ summary }) => {
  const {
    todayTotalCollected = 0,
    cashCollectedToday = 0,
    bankCollectedToday = 0,
    pendingReconciliationStatus = "N/A",
    yesterdayBalance,
  } = summary || {};

  return (
    <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-1 lg:grid-cols-4">
      <KpiCard
        title="Today's Total Collected"
        value={`₦${(todayTotalCollected || 0).toFixed(2)}`}
        icon={DollarSign}
      />
      <KpiCard
        title="Cash Collected Today"
        value={`₦${(cashCollectedToday || 0).toFixed(2)}`}
        icon={Wallet}
      />
      <KpiCard
        title="Bank Collected Today"
        value={`₦${(bankCollectedToday || 0).toFixed(2)}`}
        icon={Banknote}
      />
      <KpiCard
        title="Pending Reconciliation Status"
        value={pendingReconciliationStatus || "N/A"}
        icon={FileCheck}
      />
      {yesterdayBalance !== undefined && yesterdayBalance !== null && (
        <KpiCard
          title="Yesterday's Balance"
          value={`₦${(yesterdayBalance || 0).toFixed(2)}`}
          icon={History}
        />
      )}
    </div>
  );
};

export default AgentSummaryCardsComponent;
