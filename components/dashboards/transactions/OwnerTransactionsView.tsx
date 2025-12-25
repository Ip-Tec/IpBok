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
  const [transactionsPerPage, setTransactionsPerPage] = useState(
    session?.user?.transactionsPerPage || 10
  );

  const fetchTransactions = useCallback(async () => {
    if (!session?.user?.businessId) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/transactions?businessId=${session.user.businessId}`
      );
      if (!response.ok) {
        toast.error("Could not fetch transactions.");
        throw new Error("Failed to fetch transactions");
      }
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not fetch transactions.");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchTransactions();
    }
  }, [session, fetchTransactions]);

  const handleApprove = async (transactionId: string) => {
    try {
      const response = await fetch(
        `/api/owner/transactions/${transactionId}/approve`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve transaction");
      }
      toast.success("Transaction approved successfully!");
      fetchTransactions(); // Refresh data
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred during approval.");
      }
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const searchMatch =
      transaction.recordedBy?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transaction.recordedBy?.email
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const typeMatch =
      filters.type === "all" || transaction.type.name === filters.type;

    const statusMatch =
      filters.status === "all" || transaction.status === filters.status;

    const paymentMethodMatch =
      filters.paymentMethod === "all" ||
      transaction.paymentMethod === filters.paymentMethod;

    const dateMatch =
      !filters.dateRange ||
      (filters.dateRange.from &&
        filters.dateRange.to &&
        new Date(transaction.date) >= new Date(filters.dateRange.from) &&
        new Date(transaction.date) <= new Date(filters.dateRange.to));

    return (
      searchMatch && typeMatch && paymentMethodMatch && dateMatch && statusMatch
    );
  });

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="p-8">
      <header className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            All Transactions
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            View and filter all transactions from every agent.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between my-6 gap-4">
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

      <div className="overflow-x-auto bg-white rounded-lg shadow dark:bg-gray-800">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
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
            ) : currentTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center">
                  No transactions found.
                </td>
              </tr>
            ) : (
              currentTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="bg-white border-b last:border-b-0 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <td className="px-6 py-4">
                    {transaction.recordedBy?.name || "N/A"}
                    <div className="text-xs text-gray-500">
                      {transaction.recordedBy?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(transaction.date).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
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
                        }
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
      <div className="flex justify-between items-center mt-4">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-400">
            Showing {indexOfFirstTransaction + 1} to{" "}
            {Math.min(indexOfLastTransaction, filteredTransactions.length)} of{" "}
            {filteredTransactions.length} transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            onClick={() => paginate(currentPage + 1)}
            disabled={
              indexOfLastTransaction >= filteredTransactions.length
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OwnerTransactionsView;