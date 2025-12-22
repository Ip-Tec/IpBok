"use client";
import React, { useState, useEffect, useCallback } from "react";
import { User, Transaction } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import AgentTransactionsTable from "@/components/agent/AgentTransactionsTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import AddTransactionForm from "@/components/agent/AddTransactionForm";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle } from "lucide-react";

interface AgentTransactionsViewProps {
  user: User;
}

const AgentTransactionsView = ({ user }: AgentTransactionsViewProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] =
    useState(false);
  const [currentTransactionType, setCurrentTransactionType] = useState<
    "Deposit" | "Withdrawal" | null
  >(null);
  const { toast } = useToast();

  const [transactionsData, setTransactionsData] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTransactions = useCallback(async () => {
    if (!user.businessId) return; // Don't fetch if business ID is not available
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions?businessId=${user.businessId}`); // Pass businessId as a query parameter
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Transaction[] = await response.json();
      setTransactionsData(data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user.id]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleAddTransaction = useCallback(
    async (
      mainTransaction: Omit<
        Transaction,
        "id" | "businessId" | "userId" | "date" | "status" | "type"
      > & { type: "Deposit" | "Withdrawal" | "Charge" },
      chargeTransaction?: Omit<
        Transaction,
        "id" | "businessId" | "userId" | "date" | "status" | "type"
      > & { type: "Deposit" | "Withdrawal" | "Charge" }
    ) => {
      setIsLoading(true);
      const transactionsToProcess = [mainTransaction];
      if (chargeTransaction) {
        transactionsToProcess.push(chargeTransaction);
      }
      try {
        for (const transaction of transactionsToProcess) {
          const transactionToSave = {
            ...transaction,
            businessId: user.businessId,
            userId: user.id,
            date: new Date().toISOString(),
            status: "pending",
          };
          const response = await fetch("/api/transactions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(transactionToSave),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
        
        const description = chargeTransaction
          ? `Successfully added a ${mainTransaction.type} of ${mainTransaction.amount} and a Charge of ${chargeTransaction.amount}.`
          : `Successfully added a ${mainTransaction.type} of ${mainTransaction.amount}.`;
        
        toast({
          title: `${mainTransaction.type} Added`,
          description: description,
        });
        
        setIsFormOpen(false);
        setCurrentTransactionType(null);
        fetchTransactions(); // Re-fetch transactions to update the list
      } catch (error) {
        console.error("Failed to add transaction:", error);
        const description = chargeTransaction
        ? `Failed to add ${mainTransaction.type.toLowerCase()} and charge.`
        : `Failed to add ${mainTransaction.type.toLowerCase()}.`;
        toast({
          title: "Error",
          description: description,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [user.businessId, user.id, toast, fetchTransactions]
  );

  return (
    <div className="p-8">
      <header className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            My Transactions
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            View and manage your daily transactions.
          </p>
        </div>
        <Dialog
          open={isAddTransactionDialogOpen}
          onOpenChange={setIsAddTransactionDialogOpen}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddTransactionDialogOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Transaction Type</DialogTitle>
              <DialogDescription>
                Choose the type of transaction you want to add.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button
                onClick={() => {
                  setCurrentTransactionType("Deposit");
                  setIsFormOpen(true);
                  setIsAddTransactionDialogOpen(false);
                }}
              >
                Add Deposit
              </Button>
              <Button
                onClick={() => {
                  setCurrentTransactionType("Withdrawal");
                  setIsFormOpen(true);
                  setIsAddTransactionDialogOpen(false);
                }}
              >
                Add Withdrawal
              </Button>

            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Loading transactions...
          </p>
        ) : (
          <AgentTransactionsTable transactions={transactionsData} />
        )}
      </div>

      {/* Add Transaction Dialogs */}
      <Dialog
        open={isFormOpen && currentTransactionType === "Deposit"}
        onOpenChange={(open) => !open && setIsFormOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Deposit</DialogTitle>
          </DialogHeader>
          <AddTransactionForm
            onAddTransaction={(mainTx, chargeTx) => handleAddTransaction(mainTx, chargeTx)}
            transactionType="Deposit"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isFormOpen && currentTransactionType === "Withdrawal"}
        onOpenChange={(open) => !open && setIsFormOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Withdrawal</DialogTitle>
          </DialogHeader>
          <AddTransactionForm
            onAddTransaction={(mainTx, chargeTx) => handleAddTransaction(mainTx, chargeTx)}
            transactionType="Withdrawal"
          />
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default AgentTransactionsView;
