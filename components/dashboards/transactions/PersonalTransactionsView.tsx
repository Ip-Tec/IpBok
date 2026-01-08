"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
  Trash2,
  Edit,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

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
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Transaction deleted");
      fetchTransactions(currentPage, debouncedSearchQuery);
    } catch (error) {
      toast.error("Could not delete transaction");
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    // Determine type for dialog (UI purposes mainly, passed data overrides)
    const typeName =
      tx.type.name === "Deposit" || tx.type.name === "Income"
        ? "Deposit"
        : "Withdrawal";
    // Wait, setRecordType expects "Income" | "Expense" string usually?
    // Let's check state definition: const [recordType, setRecordType] = useState<"Income" | "Expense">("Income");
    // So I should pass "Income" or "Expense".
    setRecordType(
      ["Deposit", "Income"].includes(tx.type.name) ? "Income" : "Expense",
    );
    setIsRecordDialogOpen(true);
  };

  const getDisplayType = (typeName: string) => {
    if (typeName === "Deposit" || typeName === "Income") return "Income";
    if (typeName === "Withdrawal" || typeName === "Expense") return "Expense";
    return typeName;
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="p-2 flex flex-col bg-card md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
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
              setEditingTransaction(null);
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
              setEditingTransaction(null);
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
        initialData={
          editingTransaction
            ? {
                id: editingTransaction.id,
                amount: editingTransaction.amount,
                description: editingTransaction.description,
                category: editingTransaction.category,
                paymentMethod: editingTransaction.paymentMethod,
              }
            : null
        }
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

      {/* Mobile Card View (Visible on Small Screens) */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="text-center py-8 animate-pulse text-muted-foreground">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground italic">
            No transactions found.
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-start justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-full",
                    getDisplayType(tx.type.name) === "Income"
                      ? "bg-green-500/10 text-green-600"
                      : "bg-red-500/10 text-red-600",
                  )}
                >
                  {getDisplayType(tx.type.name) === "Income" ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {tx.description || "Transaction"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString("en-GB")} •{" "}
                    {tx.category}
                  </p>
                  <p
                    className={cn(
                      "font-bold mt-1",
                      getDisplayType(tx.type.name) === "Income"
                        ? "text-green-600"
                        : "text-foreground",
                    )}
                  >
                    {getDisplayType(tx.type.name) === "Income" ? "+" : "-"}₦
                    {tx.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleEdit(tx)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(tx.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (Hidden on Small Screens) */}
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
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-muted-foreground animate-pulse"
                  >
                    Updating list...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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
                            getDisplayType(tx.type.name) === "Income"
                              ? "bg-green-500/10 text-green-600"
                              : "bg-red-500/10 text-red-600",
                          )}
                        >
                          {getDisplayType(tx.type.name) === "Income" ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {getDisplayType(tx.type.name)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString("en-GB")}
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
                        getDisplayType(tx.type.name) === "Income"
                          ? "text-green-600"
                          : "text-foreground",
                      )}
                    >
                      {getDisplayType(tx.type.name) === "Income" ? "+" : "-"}₦
                      {tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(tx)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(tx.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
