"use client";

import { useState, useEffect, useCallback } from "react";

interface DashboardData {
  kpis: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    cashFlow: number;
  };
  recentTransactions: {
    id: string;
    date: string;
    description: string;
    type: string;
    amount: number;
    recordedBy: string;
  }[];
  charts?: any;
}

export function useAccountingDashboardData() {
  const [data, setData] = useState<DashboardData>({
    kpis: { totalIncome: 0, totalExpenses: 0, netProfit: 0, cashFlow: 0 },
    recentTransactions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/accounting");
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
