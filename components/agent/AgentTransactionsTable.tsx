"use client";
import React, { useState } from "react";
import { Transaction, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface AgentTransactionsTableProps {
  transactions: Transaction[];
  user: User;
  onTransactionUpdate: () => void;
}

const TransactionRow = ({
  transaction,
  user,
  onConfirm,
}: {
  transaction: Transaction;
  user: User;
  onConfirm: (id: string) => void;
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
            {new Date(transaction.date).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
            }).format(transaction.amount)}
          </span>
          <ChevronDown
            className={cn(
              "w-5 h-5 transition-transform text-gray-400",
              isOpen ? "rotate-180" : "",
            )}
          />
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500">Method:</div>
            <div className="text-gray-900 dark:text-white text-right capitalize">
              {transaction.paymentMethod.replace("_", " ")}
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
          {transaction.type.name === "Cash Advance" &&
            transaction.status === "PENDING" &&
            transaction.recipientId === user.id && (
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={() => onConfirm(transaction.id)}
              >
                Confirm Receipt
              </Button>
            )}
        </div>
      )}
    </div>
  );
};

const AgentTransactionsTable: React.FC<AgentTransactionsTableProps> = ({
  transactions,
  user,
  onTransactionUpdate,
}) => {
  const handleConfirm = async (transactionId: string) => {
    try {
      const response = await fetch(
        `/api/transactions/${transactionId}/confirm`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to confirm transaction");
      }

      toast.success("Cash advance confirmed successfully!");
      onTransactionUpdate();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred during confirmation.");
      }
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4 px-4 md:px-0">
        Today&apos;s Transactions
      </h3>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {transactions.length === 0 ? (
          <p className="p-6 text-gray-500 dark:text-gray-400 text-center">
            No transactions recorded today.
          </p>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(transaction.date).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            },
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {transaction.type.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {new Intl.NumberFormat("en-NG", {
                            style: "currency",
                            currency: "NGN",
                          }).format(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 capitalize">
                          {transaction.paymentMethod.replace("_", " ")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span
                            className={cn(
                              "px-2 py-1 text-[10px] font-semibold rounded-full uppercase",
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {transaction.type.name === "Cash Advance" &&
                            transaction.status === "PENDING" &&
                            transaction.recipientId === user.id && (
                              <Button
                                size="sm"
                                onClick={() => handleConfirm(transaction.id)}
                              >
                                Confirm Receipt
                              </Button>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  user={user}
                  onConfirm={handleConfirm}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgentTransactionsTable;
