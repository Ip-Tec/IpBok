"use client";
import React from "react";
import { Transaction, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AgentTransactionsTableProps {
  transactions: Transaction[];
  user: User;
  onTransactionUpdate: () => void;
}

const AgentTransactionsTable: React.FC<AgentTransactionsTableProps> = ({
  transactions,
  user,
  onTransactionUpdate,
}) => {
  const handleConfirm = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/confirm`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to confirm transaction');
      }

      toast.success("Cash advance confirmed successfully!");
      onTransactionUpdate(); // Refresh the transactions list
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unknown error occurred during confirmation.');
      }
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Today&apos;s Transactions</h3>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        {transactions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No transactions recorded today.
          </p>
        ) : (
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
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(transaction.date).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {transaction.type.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 capitalize">
                      {transaction.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 capitalize">
                      {transaction.status.toLowerCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {transaction.type.name === 'Cash Advance' &&
                       transaction.status === 'PENDING' &&
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
        )}
      </div>
    </div>
  );
};

export default AgentTransactionsTable;
