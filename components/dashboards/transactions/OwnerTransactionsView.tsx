"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
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

const TransactionMobileRow = ({
  transaction,
  onApprove,
}: {
  transaction: Transaction;
  onApprove: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4 bg-white dark:bg-gray-800">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 dark:text-white">
            {transaction.type.name}
          </span>
          <span className="text-sm text-gray-500">
            {new Date(transaction.date).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
            }).format(transaction.amount)}
          </span>
          <svg
            className={cn(
              "w-5 h-5 transition-transform",
              isOpen ? "rotate-180" : "",
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500">Agent:</div>
            <div className="text-gray-900 dark:text-white text-right font-medium">
              {transaction.recordedBy?.name || "N/A"}
              <div className="text-[10px] text-gray-400 font-normal">
                {transaction.recordedBy?.email}
              </div>
            </div>
            <div className="text-gray-500">Full Date:</div>
            <div className="text-gray-900 dark:text-white text-right">
              {new Date(transaction.date).toLocaleString()}
            </div>
            <div className="text-gray-500">Status:</div>
            <div className="text-right">
              <span
                className={cn(
                  "px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase",
                  {
                    "bg-yellow-100 text-yellow-800":
                      transaction.status === "PENDING",
                    "bg-green-100 text-green-800":
                      transaction.status === "CONFIRMED",
                    "bg-red-100 text-red-800":
                      transaction.status === "CANCELLED",
                  },
                )}
              >
                {transaction.status}
              </span>
            </div>
          </div>
          {transaction.status === "PENDING" && (
            <Button size="sm" className="w-full mt-2" onClick={onApprove}>
              Approve Transaction
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const OwnerTransactionsView = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    type: string;
    paymentMethod: string;
    dateRange: DateRange | undefined;
    status: string;
  }>({
    type: "all",
    paymentMethod: "all",
    dateRange: undefined,
    status: "all",
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

      if (query) {
        params.append("searchQuery", query);
      }
      if (filters.status !== "all") {
        params.append("status", filters.status);
      }
      if (filters.type !== "all") {
        params.append("type", filters.type);
      }
      if (filters.paymentMethod !== "all") {
        params.append("paymentMethod", filters.paymentMethod);
      }
      if (filters.dateRange?.from) {
        params.append("startDate", filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        params.append("endDate", filters.dateRange.to.toISOString());
      }

      try {
        const response = await fetch(`/api/transactions?${params.toString()}`);
        if (!response.ok) {
          toast.error("Could not fetch transactions.");
          throw new Error("Failed to fetch transactions");
        }
        const data = await response.json();
        setTransactions(data.transactions);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error(error);
        toast.error("Could not fetch transactions.");
      } finally {
        setIsLoading(false);
      }
    },
    [session, transactionsPerPage, filters],
  );

  useEffect(() => {
    if (session) {
      fetchTransactions(currentPage, debouncedSearchQuery);
    }
  }, [session, currentPage, debouncedSearchQuery, fetchTransactions, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, filters]);

  const handleApprove = async (transactionId: string) => {
    try {
      const response = await fetch(
        `/api/owner/transactions/${transactionId}/approve`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve transaction");
      }
      toast.success("Transaction approved successfully!");
      fetchTransactions(currentPage, debouncedSearchQuery);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred during approval.");
      }
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="p-4">
      <header className="bg-card flex items-center justify-between pb-4 border-b">
        <div className="px-4">
          <h1 className="text-3xl font-bold text-secondary-foreground">
            All Transactions
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            View and filter all transactions from every agent.
          </p>
        </div>
      </header>

      <div className="md:p-8 flex flex-wrap items-center justify-between my-6 gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by agent name or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Select
            value={filters.status}
            onValueChange={(value: string) =>
              setFilters({ ...filters, status: value })
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.type}
            onValueChange={(value: string) =>
              setFilters({ ...filters, type: value })
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Transaction Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Deposit">Deposit</SelectItem>
              <SelectItem value="Withdrawal">Withdrawal</SelectItem>
              <SelectItem value="Cash Advance">Cash Advance</SelectItem>
              <SelectItem value="Charge">Charge</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.paymentMethod}
            onValueChange={(value: string) =>
              setFilters({ ...filters, paymentMethod: value })
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="ATM_CARD">ATM Card</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
            </SelectContent>
          </Select>
          <DatePickerWithRange
            date={filters.dateRange}
            onDateChange={(dateRange) => setFilters({ ...filters, dateRange })}
          />
        </div>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-secondary-foreground uppercase bg-card text-accent">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Agent
                </th>
                <th scope="col" className="px-6 py-3">
                  Date
                </th>
                <th scope="col" className="px-6 py-3">
                  Type
                </th>
                <th scope="col" className="px-6 py-3">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="bg-card-foreground/10 hover:bg-muted/50 border-b last:border-b-0 dark:border-gray-700"
                  >
                    <td className="px-6 py-4">
                      {transaction.recordedBy?.name || "N/A"}
                      <div className="text-xs text-gray-500">
                        {transaction.recordedBy?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(transaction.date).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td className="px-6 py-4">{transaction.type.name}</td>
                    <td className="px-6 py-4 font-medium">
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: "NGN",
                      }).format(transaction.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2 py-1 text-xs font-semibold rounded-full",
                          {
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300":
                              transaction.status === "PENDING",
                            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300":
                              transaction.status === "CONFIRMED",
                            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300":
                              transaction.status === "CANCELLED",
                          },
                        )}
                      >
                        {transaction.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {transaction.status === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(transaction.id)}
                        >
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Collapsible View */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="p-6 text-center">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center">No transactions found.</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((transaction) => (
                <TransactionMobileRow
                  key={transaction.id}
                  transaction={transaction}
                  onApprove={() => handleApprove(transaction.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default OwnerTransactionsView;
