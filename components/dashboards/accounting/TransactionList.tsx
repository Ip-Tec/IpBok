"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface TransactionListProps {
  type: "Deposit" | "Withdrawal" | "all";
  title: string;
}

const TransactionList = ({ type, title }: TransactionListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    dateRange: DateRange | undefined;
  }>({
    dateRange: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const transactionsPerPage = 10;

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchTransactions = useCallback(
    async (page: number, query: string) => {
      if (!session?.user?.businessId) return;
      setIsLoading(true);

      const params = new URLSearchParams({
        businessId: session.user.businessId,
        page: page.toString(),
        limit: transactionsPerPage.toString(),
      });

      if (query) params.append("searchQuery", query);
      // Ensure we query for the database type, which is "Deposit" or "Withdrawal"
      if (type !== "all") params.append("type", type);

      if (filters.dateRange?.from)
        params.append("startDate", filters.dateRange.from.toISOString());
      if (filters.dateRange?.to)
        params.append("endDate", filters.dateRange.to.toISOString());

      try {
        const response = await fetch(`/api/transactions?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setTransactions(data.transactions);
        setTotalPages(data.totalPages);
      } catch (error) {
        toast.error("Error loading transactions");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [session, filters, type],
  );

  useEffect(() => {
    fetchTransactions(currentPage, debouncedSearchQuery);
  }, [fetchTransactions, currentPage, debouncedSearchQuery]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-muted-foreground text-sm">
            View details of your {title.toLowerCase()}.
          </p>
        </div>
      </header>

      {/* Filters Area */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search descriptions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DatePickerWithRange
            date={filters.dateRange}
            onDateChange={(range) =>
              setFilters({ ...filters, dateRange: range })
            }
          />
        </div>
      </div>

      {/* Mobile Card View (Visible on Small Screens) */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="text-center py-8 animate-pulse text-muted-foreground">
            Loading list...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground italic">
            No transactions found.
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      ["Deposit", "Income"].includes(tx.type.name)
                        ? "bg-green-500/10 text-green-600"
                        : "bg-red-500/10 text-red-600",
                    )}
                  >
                    {["Deposit", "Income"].includes(tx.type.name) ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {tx.description || "Transaction"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-bold text-base",
                      ["Deposit", "Income"].includes(tx.type.name)
                        ? "text-green-600"
                        : "text-foreground",
                    )}
                  >
                    {["Deposit", "Income"].includes(tx.type.name) ? "+" : "-"}₦
                    {tx.amount.toLocaleString()}
                  </p>
                  <span className="inline-block px-2 py-0.5 bg-muted rounded border text-[10px] font-mono mt-1">
                    {tx.category || "General"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                <span>Method: {tx.paymentMethod}</span>
                {/* Actions can be added here if needed, or kept simple */}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table Section (Hidden on Small Screens) */}
      <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Status & Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted-foreground animate-pulse"
                  >
                    Loading list...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted-foreground italic"
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-full",
                            ["Deposit", "Income"].includes(tx.type.name)
                              ? "bg-green-500/10 text-green-600"
                              : "bg-red-500/10 text-red-600",
                          )}
                        >
                          {["Deposit", "Income"].includes(tx.type.name) ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {/* Explicit UI Mapping Here */}
                            {["Deposit", "Income"].includes(tx.type.name)
                              ? "Income"
                              : "Expense"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-muted rounded border text-[10px] font-mono">
                        {tx.category || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {tx.description || "Transaction"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-muted rounded border text-[10px] font-mono">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "px-6 py-4 text-right font-bold text-lg",
                        ["Deposit", "Income"].includes(tx.type.name)
                          ? "text-green-600"
                          : "text-foreground",
                      )}
                    >
                      {["Deposit", "Income"].includes(tx.type.name) ? "+" : "-"}
                      ₦{tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-xs text-muted-foreground italic">
          Showing page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionList;
