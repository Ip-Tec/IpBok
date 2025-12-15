"use client";
import {
  User,
  AgentSummaryCards,
  AgentTaskStatus,
  Transaction,
} from "@/lib/types";
import React, { useState } from "react";
import {
  LayoutDashboard,
  ArrowRightLeft,
  FileCheck,
  Settings,
  Menu,
  PlusCircle,
} from "lucide-react";
import SideNav from "./SideNav";
import AgentSummaryCardsComponent from "../agent/AgentSummaryCards";
import AgentDailyTaskStatus from "../agent/AgentDailyTaskStatus";
import AgentTransactionsTable from "../agent/AgentTransactionsTable";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui button
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"; // Assuming shadcn/ui dialog
import { useToast } from "@/components/ui/use-toast"; // Assuming shadcn/ui toast
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AddTransactionForm from "../agent/AddTransactionForm";
import { v4 as uuidv4 } from "uuid"; // For generating unique IDs

const AgentDashboard = (user: User) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] = useState(false);
  const [currentTransactionType, setCurrentTransactionType] = useState<
    "Deposit" | "Withdrawal" | "Charge" | null
  >(null);

  const [summaryCardsData, _setSummaryCardsData] = useState<AgentSummaryCards>({
    todayTotalCollected: 1250.0,
    cashCollectedToday: 750.0,
    bankCollectedToday: 500.0,
    pendingReconciliationStatus: "Pending",
    yesterdayBalance: 1500.0,
  });

  const [taskStatusData, _setTaskStatusData] = useState<AgentTaskStatus>({
    loggedIn: true,
    transactionsRecorded: true,
    reconciliationPending: true,
    reconciled: false,
  });

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

  const [systemExpectedCash, _setSystemExpectedCash] = useState<number>(1000.0);
  const [agentEnteredCash, setAgentEnteredCash] = useState<number>(0);
  const [isDayLocked, setIsDayLocked] = useState<boolean>(false);
  const { toast } = useToast();


  const reconciliationDifference = React.useMemo(() => {
    return systemExpectedCash - agentEnteredCash;
  }, [systemExpectedCash, agentEnteredCash]);

  const sidebarNavLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Transaction",
      href: "/dashboard/transactions",
      icon: <ArrowRightLeft className="w-5 h-5" />,
    },
    {
      name: "Reconciliation",
      href: "/dashboard/reconciliation",
      icon: <FileCheck className="w-5 h-5" />,
    },
    {
      name: "Setting",
      href: "/dashboard/settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const handleAddTransaction = (
    newTransaction: Omit<
      Transaction,
      "id" | "businessId" | "userId" | "date" | "status"
    >
  ) => {
    // In a real app, you'd send this to an API and then update state with the response
    const transactionWithDefaults: Transaction = {
      ...newTransaction,
      id: uuidv4(),
      businessId: user.businessId || "unknown", // Fallback if businessId is not available
      userId: user.id,
      date: new Date().toISOString(),
      status: "pending", // New transactions are pending by default
    };
    setTransactionsData((prev) => [...prev, transactionWithDefaults]);
    setIsFormOpen(false); // Close the dialog after adding
    setCurrentTransactionType(null);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <SideNav
        user={user}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sidebarNavLinks={sidebarNavLinks}
      />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 text-gray-800 dark:text-gray-200">
        <header className="flex items-center justify-between p-4 bg-white border-b dark:bg-gray-800 dark:border-gray-700">
          <button
            className="p-2 text-gray-500 rounded-md lg:hidden hover:text-gray-600 focus:outline-none focus:ring"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Welcome, {user.name}
          </h1>
        </header>
        <div className="p-3 text-gray-800 dark:text-gray-200">


          {/* Grid for Summary, Task Status, Reconciliation, Notifications */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"></div>
        </div>

        {/* A. Agent – Top Summary Cards */}
        <div className="md:col-span-2 py-4 px-6 rounded-lg shadow-md bg-white dark:bg-gray-800 h-full">
          <h3 className="text-lg font-semibold mb-4">Summary</h3>{" "}
          <AgentSummaryCardsComponent summary={summaryCardsData} />
        </div>

        {/* B. Agent – Daily Task Status */}
        <div className="py-4 px-6 rounded-lg shadow-md bg-white dark:bg-gray-800 h-full">
          <h3 className="text-lg font-semibold mb-4">Daily Task Status</h3>
          <AgentDailyTaskStatus status={taskStatusData} />
        </div>

        {/* E. Agent – Reconciliation Section (End of Day) */}
        <div className="py-4 px-6 rounded-lg shadow-md bg-white dark:bg-gray-800 h-full">
          <h3 className="text-lg font-semibold mb-4">
            Reconciliation (End of Day)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="systemExpectedCash">System Expected Cash</Label>
              <Input
                id="systemExpectedCash"
                type="number"
                value={systemExpectedCash.toFixed(2)}
                readOnly
                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="agentEnteredCash">Agent Entered Cash</Label>
              <Input
                id="agentEnteredCash"
                type="number"
                value={agentEnteredCash}
                onChange={(e) =>
                  setAgentEnteredCash(parseFloat(e.target.value))
                }
                readOnly={isDayLocked}
                className={
                  isDayLocked
                    ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                    : ""
                }
              />
            </div>
            <div>
              <Label htmlFor="difference">Difference</Label>
              <Input
                id="difference"
                type="number"
                value={reconciliationDifference.toFixed(2)}
                readOnly
                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
            </div>
          </div>
          <Button
            className="mt-6 w-full"
            disabled={isDayLocked}
            onClick={() => setIsDayLocked(true)} // Basic lock functionality
          >
            🔒 Submit & Lock Day
          </Button>
        </div>



        {/* D. Agent – Today’s Transactions (Full width, separate from the above grid) */}
        <div className="mt-6">
          <div className="py-4 px-6 rounded-lg shadow-md bg-white dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-4">Today’s Transactions</h3>
            <AgentTransactionsTable transactions={transactionsData} />
          </div>
        </div>
      </main>

      {/* Fixed Add Transaction Button */}
      <Dialog open={isAddTransactionDialogOpen} onOpenChange={setIsAddTransactionDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-4 right-4 rounded-full p-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            size="lg"
            onClick={() => setIsAddTransactionDialogOpen(true)}
          >
            <PlusCircle className="w-6 h-6" />
            <span className="sr-only">Add Transaction</span>
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
              className="w-full"
              onClick={() => {
                setCurrentTransactionType("Deposit");
                setIsFormOpen(true);
                setIsAddTransactionDialogOpen(false);
              }}
            >
              Add Deposit
            </Button>
            <Button
              className="w-full"
              onClick={() => {
                setCurrentTransactionType("Withdrawal");
                setIsFormOpen(true);
                setIsAddTransactionDialogOpen(false);
              }}
            >
              Add Withdrawal
            </Button>
            <Button
              className="w-full"
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

      {/* Existing Add Transaction Forms (now triggered by selection dialog) */}
      <Dialog
        open={isFormOpen && currentTransactionType === "Deposit"}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setCurrentTransactionType(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Deposit</DialogTitle>
          </DialogHeader>
          <AddTransactionForm
            onAddTransaction={(transaction) => {
              handleAddTransaction(transaction);
              toast({
                title: "Deposit Added",
                description: `Successfully added a deposit of ${transaction.amount}.`,
              });
            }}
            transactionType="Deposit"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isFormOpen && currentTransactionType === "Withdrawal"}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setCurrentTransactionType(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Withdrawal</DialogTitle>
          </DialogHeader>
          <AddTransactionForm
            onAddTransaction={(transaction) => {
              handleAddTransaction(transaction);
              toast({
                title: "Withdrawal Added",
                description: `Successfully added a withdrawal of ${transaction.amount}.`,
              });
            }}
            transactionType="Withdrawal"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isFormOpen && currentTransactionType === "Charge"}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setCurrentTransactionType(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Charge</DialogTitle>
          </DialogHeader>
          <AddTransactionForm
            onAddTransaction={(transaction) => {
              handleAddTransaction(transaction);
              toast({
                title: "Charge Added",
                description: `Successfully added a charge of ${transaction.amount}.`,
              });
            }}
            transactionType="Charge"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentDashboard;

