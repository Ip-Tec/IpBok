"use client";
import React from "react";
import { User, Transaction } from "@/lib/types";
import { PlusCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddTransactionForm from "./AddTransactionForm";


interface AgentActionsHeaderProps {
  user: User;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isSidebarOpen: boolean;
  setIsFormOpen: (isOpen: boolean) => void;
  isFormOpen: boolean;
  setCurrentTransactionType: (
    type: "Deposit" | "Withdrawal" | null
  ) => void;
  currentTransactionType: "Deposit" | "Withdrawal" | null;
  onAddTransaction: (
    newTransaction: Omit<
      Transaction,
      "id" | "businessId" | "userId" | "date" | "status"
    >
  ) => void;
}

const AgentActionsHeader: React.FC<AgentActionsHeaderProps> = ({
  user,
  setIsSidebarOpen,
  isSidebarOpen: _isSidebarOpen,
  setIsFormOpen,
  isFormOpen,
  setCurrentTransactionType,
  currentTransactionType,
  onAddTransaction,
}) => {
  return (
    <>
      <header className="flex items-center justify-between p-4 bg-white border-b dark:bg-gray-800 dark:border-gray-700">
        <button
          className="p-2 text-gray-500 rounded-md lg:hidden hover:text-gray-600 focus:outline-none focus:ring"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Welcome, {user.name}!
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm">
            This is your agent dashboard. Here you can manage your transactions.
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog
            open={isFormOpen && currentTransactionType === "Deposit"}
            onOpenChange={setIsFormOpen}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setCurrentTransactionType("Deposit");
                  setIsFormOpen(true);
                }}
                className="flex items-center space-x-1 px-3 py-2 text-sm"
              >
                <PlusCircle className="w-4 h-4" /> <span>Deposit</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Deposit</DialogTitle>
              </DialogHeader>
              <AddTransactionForm
                onAddTransaction={onAddTransaction}
                transactionType="Deposit"
              />
            </DialogContent>
          </Dialog>

          <Dialog
            open={isFormOpen && currentTransactionType === "Withdrawal"}
            onOpenChange={setIsFormOpen}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setCurrentTransactionType("Withdrawal");
                  setIsFormOpen(true);
                }}
                className="flex items-center space-x-1 px-3 py-2 text-sm"
              >
                <PlusCircle className="w-4 h-4" /> <span>Withdrawal</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Withdrawal</DialogTitle>
              </DialogHeader>
              <AddTransactionForm
                onAddTransaction={onAddTransaction}
                transactionType="Withdrawal"
              />
            </DialogContent>
          </Dialog>

          <Dialog
            open={isFormOpen && currentTransactionType === "Charge"}
            onOpenChange={setIsFormOpen}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setCurrentTransactionType("Charge");
                  setIsFormOpen(true);
                }}
                className="flex items-center space-x-1 px-3 py-2 text-sm"
              >
                <PlusCircle className="w-4 h-4" /> <span>Charge</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Charge...</DialogTitle>
              </DialogHeader>
              <AddTransactionForm
                onAddTransaction={onAddTransaction}
                transactionType="Charge"
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>
    </>
  );
};

export default AgentActionsHeader;
