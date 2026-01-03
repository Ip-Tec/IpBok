import {
  User,
  AgentSummaryCards,
  AgentTaskStatus,
  Transaction,
  CashAdvance,
} from "@/lib/types";
import React, { useState, useEffect, useCallback } from "react";
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
import { CashConfirmationCard } from "./agents/CashConfirmationCard";

const AgentDashboard = (user: User) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] =
    useState(false);
  const [currentTransactionType, setCurrentTransactionType] = useState<
    "Deposit" | "Withdrawal" | null
  >(null);

  const { toast } = useToast();



  const [summaryCardsData, setSummaryCardsData] = useState<AgentSummaryCards>(
    {} as AgentSummaryCards
  );
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);
  const [pendingCashAdvance, setPendingCashAdvance] =
    useState<CashAdvance | null>(null);
  const [businessPhone, setBusinessPhone] = useState<string | null>(null);

  const fetchSummaryData = useCallback(async () => {
    if (!user.id) {
      setIsLoadingSummary(false);
      return;
    }
    setIsLoadingSummary(true);
    try {
      const response = await fetch(`/api/agents/${user.id}/summary`); // Assuming this endpoint exists
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSummaryCardsData(data);
      setPendingCashAdvance(data.pendingCashAdvance);
      setBusinessPhone(data.businessPhone);
    } catch (error) {
      console.error("Failed to fetch summary data:", error);
      toast({
        title: "Error",
        description: "Failed to load summary data.",
        variant: "destructive",
      });
      setSummaryCardsData({} as AgentSummaryCards); // Reset on error
    }
  }, [user.id]);

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

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
      type: { name: "Deposit" },
      amount: 500.0,
      paymentMethod: "cash",
      date: new Date().toISOString(),
      status: "pending",
      description: "Initial cash deposit",
      recordedBy: { name: user.name ?? null, email: user.email ?? null },
    },
    {
      id: uuidv4(),
      businessId: user.businessId || "unknown",
      type: { name: "Withdrawal" },
      amount: 100.0,
      paymentMethod: "bank",
      date: new Date().toISOString(),
      status: "pending",
      description: "Bank withdrawal for expenses",
      recordedBy: null,
      recipientId: undefined,
    },
  ]);

  const [systemExpectedCash, _setSystemExpectedCash] = useState<number>(1000.0);
  const [agentEnteredCash, setAgentEnteredCash] = useState<number>(0);
  const [isDayLocked, setIsDayLocked] = useState<boolean>(false);

  const reconciliationDifference = React.useMemo(() => {
    return systemExpectedCash - agentEnteredCash;
  }, [systemExpectedCash, agentEnteredCash]);

  const sidebarNavLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-7 h-7" />,
    },
    {
      name: "Transaction",
      href: "/dashboard/transactions",
      icon: <ArrowRightLeft className="w-7 h-7" />,
    },
    {
      name: "Reconciliation",
      href: "/dashboard/reconciliation",
      icon: <FileCheck className="w-7 h-7" />,
    },
    {
      name: "Setting",
      href: "/dashboard/settings",
      icon: <Settings className="w-7 h-7" />,
    },
  ];

  const handleAddTransaction = async (
    mainTransaction: Omit<
      Transaction,
      "id" | "businessId" | "recordedBy" | "date" | "status" | "type" | "recipientId"
    > & { type: "Deposit" | "Withdrawal" | "Charge" },
    chargeTransaction?: Omit<
      Transaction,
      "id" | "businessId" | "recordedBy" | "date" | "status" | "type" | "recipientId"
    > & { type: "Deposit" | "Withdrawal" | "Charge" }
  ) => {
    const transactionsToProcess = [mainTransaction];
    if (chargeTransaction) {
      transactionsToProcess.push(chargeTransaction);
    }

    try {
      for (const transaction of transactionsToProcess) {
        const transactionToSave = {
          type: transaction.type,
          amount: transaction.amount,
          paymentMethod: transaction.paymentMethod,
          description: transaction.description || "",
          businessId: user.businessId,
          userId: user.id,
          date: new Date().toISOString(),
        };

        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transactionToSave),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Failed to add transaction" }));
          toast({
            title: "Error",
            description: errorData.message || "Failed to add transaction.",
            variant: "destructive",
          });
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
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
      fetchSummaryData(); // Refresh summary data
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
    }
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
          {pendingCashAdvance && (
            <CashConfirmationCard
              cashAdvance={pendingCashAdvance}
              businessPhone={businessPhone}
              onConfirmation={fetchSummaryData}
            />
          )}

          {/* Grid for Summary, Task Status, Reconciliation, Notifications */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"></div>
        </div>

        {/* A. Agent – Top Summary Cards */}
        <div className="md:col-span-2 py-4 px-6 rounded-lg shadow-md bg-white dark:bg-gray-800 h-full">
          <h3 className="text-lg font-semibold mb-4">Summary</h3>{" "}
          {isLoadingSummary ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Loading summary...
            </p>
          ) : (
            <AgentSummaryCardsComponent summary={summaryCardsData} />
          )}
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
            <AgentTransactionsTable 
              transactions={transactionsData} 
              user={user} 
              onTransactionUpdate={fetchSummaryData} 
            />
          </div>
        </div>
      </main>

      {/* Fixed Add Transaction Button */}
      <Dialog
        open={isAddTransactionDialogOpen}
        onOpenChange={setIsAddTransactionDialogOpen}
      >
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
            onAddTransaction={(mainTx, chargeTx) =>
              handleAddTransaction(mainTx, chargeTx)
            }
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
            onAddTransaction={(mainTx, chargeTx) =>
              handleAddTransaction(mainTx, chargeTx)
            }
            transactionType="Withdrawal"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentDashboard;
