"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RecordTransactionDialog } from "@/components/dashboards/accounting/RecordTransactionDialog";

const PersonalTransactionsView = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    type: string;
    dateRange: DateRange | undefined;
  }>({
    type: "all",
    dateRange: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [recordType, setRecordType] = useState<"Income" | "Expense">("Income");
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
      if (filters.type !== "all") params.append("type", filters.type);
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
      } finally {
        setIsLoading(false);
      }
    },
    [session, filters],
  );

  useEffect(() => {
    fetchTransactions(currentPage, debouncedSearchQuery);
  }, [fetchTransactions, currentPage, debouncedSearchQuery]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold">My Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Keep track of your personal income and spending.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="rounded-full shadow-lg"
            onClick={() => {
              setRecordType("Income");
              setIsRecordDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Income
          </Button>
          <Button
            variant="outline"
            className="rounded-full shadow-lg"
            onClick={() => {
              setRecordType("Expense");
              setIsRecordDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Expense
          </Button>
        </div>
      </header>

      <RecordTransactionDialog
        open={isRecordDialogOpen}
        onOpenChange={setIsRecordDialogOpen}
        type={recordType}
        onSuccess={() => fetchTransactions(currentPage, debouncedSearchQuery)}
      />

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
          <Select
            value={filters.type}
            onValueChange={(v) => setFilters({ ...filters, type: v })}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="w-3 h-3 mr-2" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Deposit">Income</SelectItem>
              <SelectItem value="Withdrawal">Expense</SelectItem>
              <SelectItem value="Transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>

          <DatePickerWithRange
            date={filters.dateRange}
            onDateChange={(range) =>
              setFilters({ ...filters, dateRange: range })
            }
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
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
                    Updating list...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted-foreground italic"
                  >
                    No transactions recorded yet.
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
                            tx.type.name === "Deposit"
                              ? "bg-green-500/10 text-green-600"
                              : "bg-red-500/10 text-red-600",
                          )}
                        >
                          {tx.type.name === "Deposit" ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {tx.type.name === "Deposit" ? "Income" : "Expense"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString()}
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
                      {tx.description || "Personal Transaction"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-muted rounded border text-[10px] font-mono">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "px-6 py-4 text-right font-bold text-lg",
                        tx.type.name === "Deposit"
                          ? "text-green-600"
                          : "text-foreground",
                      )}
                    >
                      {tx.type.name === "Deposit" ? "+" : "-"}₦
                      {tx.amount.toLocaleString()}
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

export default PersonalTransactionsView;
