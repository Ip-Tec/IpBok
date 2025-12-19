"use client";
import React, { useState } from "react";
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
    "Deposit" | "Withdrawal" | "Charge" | null
  >(null);
  const { toast } = useToast();

  const [transactionsData, setTransactionsData] = useState<Transaction[]>([
    {
      id: uuidv4(),
      businessId: user.businessId || "unknown",
      userId: user.id,
      type: "Deposit",
      amount: 500.0,
      paymentMethod: "cash",
      date: new Date().toISOString(),
      status: "pending",
      description: "Initial cash deposit",
    },
    {
      id: uuidv4(),
      businessId: user.businessId || "unknown",
      userId: user.id,
      type: "Withdrawal",
      amount: 100.0,
      paymentMethod: "bank",
      date: new Date().toISOString(),
      status: "pending",
      description: "Bank withdrawal for expenses",
    },
  ]);

  const handleAddTransaction = (
    newTransaction: Omit<
      Transaction,
      "id" | "businessId" | "userId" | "date" | "status"
    >
  ) => {
    const transactionWithDefaults: Transaction = {
      ...newTransaction,
      id: uuidv4(),
      businessId: user.businessId || "unknown",
      userId: user.id,
      date: new Date().toISOString(),
      status: "pending",
    };
    setTransactionsData((prev) => [...prev, transactionWithDefaults]);
    setIsFormOpen(false);
    setCurrentTransactionType(null);
    toast({
      title: `${newTransaction.type} Added`,
      description: `Successfully added a ${newTransaction.type.toLowerCase()} of ${
        newTransaction.amount
      }.`,
    });
  };

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
              <Button
                onClick={() => {
                  setCurrentTransactionType("Charge");
                  setIsFormOpen(true);
                  setIsAddTransactionDialogOpen(false);
                }}
              >
                Add Charge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="mt-6">
        <AgentTransactionsTable transactions={transactionsData} />
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
            onAddTransaction={handleAddTransaction}
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
            onAddTransaction={handleAddTransaction}
            transactionType="Withdrawal"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isFormOpen && currentTransactionType === "Charge"}
        onOpenChange={(open) => !open && setIsFormOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Charge</DialogTitle>
          </DialogHeader>
          <AddTransactionForm
            onAddTransaction={handleAddTransaction}
            transactionType="Charge"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentTransactionsView;
