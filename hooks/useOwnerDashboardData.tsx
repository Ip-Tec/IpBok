import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export const useOwnerDashboardData = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboard/owner");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
};
