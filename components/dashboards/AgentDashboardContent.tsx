"use client";
import {
  User,
  AgentSummaryCards,
  AgentTaskStatus,
  Transaction,
} from "@/lib/types";
import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle } from "lucide-react";
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

const AgentDashboardContent = (user: User) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] =
    useState(false);
  const [currentTransactionType, setCurrentTransactionType] = useState<
    "Deposit" | "Withdrawal" | null
  >(null);

  const [summaryCardsData, setSummaryCardsData] = useState<AgentSummaryCards>({
    todayTotalCollected: 0,
    cashCollectedToday: 0,
    bankCollectedToday: 0,
    pendingReconciliationStatus: "N/A",
    yesterdayBalance: 0,
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);

  const [taskStatusData, setTaskStatusData] = useState<AgentTaskStatus>(
    {} as AgentTaskStatus
  );
  const [isLoadingTaskStatus, setIsLoadingTaskStatus] = useState<boolean>(true);

  const [transactionsData, setTransactionsData] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] =
    useState<boolean>(true);

  const [systemExpectedCash, setSystemExpectedCash] = useState<number>(0);
  const [agentEnteredCash, setAgentEnteredCash] = useState<number>(0);
  const [isLoadingReconciliation, setIsLoadingReconciliation] =
    useState<boolean>(true);
  const [isDayLocked, setIsDayLocked] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchSummaryData = useCallback(async () => {
    if (!user.id) {
      setIsLoadingSummary(false);
      return;
    }
    setIsLoadingSummary(true);
    try {
      const response = await fetch(`/api/agents/${user.id}/summary`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch summary" }));
        toast({
          title: "Error",
          description: errorData.message || `HTTP error! status: ${response.status}`,
          variant: "destructive",
        });
        setIsLoadingSummary(false);
        return;
      }
      const data: AgentSummaryCards = await response.json();
      // Ensure all required fields have default values
      setSummaryCardsData({
        todayTotalCollected: data.todayTotalCollected ?? 0,
        cashCollectedToday: data.cashCollectedToday ?? 0,
        bankCollectedToday: data.bankCollectedToday ?? 0,
        pendingReconciliationStatus: data.pendingReconciliationStatus ?? "N/A",
        yesterdayBalance: data.yesterdayBalance ?? 0,
      });
    } catch (error) {
      console.error("Failed to fetch summary data:", error);
      toast({
        title: "Error",
        description: "Failed to load summary data.",
        variant: "destructive",
      });
      // Set default values on error instead of empty object
      setSummaryCardsData({
        todayTotalCollected: 0,
        cashCollectedToday: 0,
        bankCollectedToday: 0,
        pendingReconciliationStatus: "Error",
        yesterdayBalance: 0,
      });
    } finally {
      setIsLoadingSummary(false);
    }
  }, [user.id, toast]);

  const fetchTaskStatusData = useCallback(async () => {
    if (!user.id) return;
    setIsLoadingTaskStatus(true);
    try {
      const response = await fetch(`/api/agents/${user.id}/task-status`); // Assuming this endpoint exists
      if (!response.ok)
        toast({
          title: "Error",
          description: `HTTP error! status: ${response.status}`,
          variant: "destructive",
        });
      // throw new Error(`HTTP error! status: ${response.status}`);
      const data: AgentTaskStatus = await response.json();
      setTaskStatusData(data);
    } catch (error) {
      console.error("Failed to fetch task status data:", error);
      toast({
        title: "Error",
        description: "Failed to load task status.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTaskStatus(false);
    }
  }, [user.id, toast]);

  const fetchTransactionsData = useCallback(async () => {
    if (!user.id) return;
    setIsLoadingTransactions(true);
    try {
      const response = await fetch(
        `/api/transactions?businessId=${user.businessId}`
      );
      if (!response.ok)
        toast({
          title: "Error",
          description: `HTTP error! status: ${response.status}`,
          variant: "destructive",
        });
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
      setIsLoadingTransactions(false);
    }
  }, [user.id, toast]);

  const fetchReconciliationData = useCallback(async () => {
    if (!user.id) return;
    setIsLoadingReconciliation(true);
    try {
      const response = await fetch(`/api/agents/${user.id}/reconciliation`); // New agent-specific endpoint
      if (!response.ok)
        toast({
          title: "Error",
          description: `HTTP error! status: ${response.status}`,
          variant: "destructive",
        });
      //throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setSystemExpectedCash(data.expected || 0); // Use 'expected' from agent-specific data
      setAgentEnteredCash(data.submitted || 0); // Use 'submitted' from agent-specific data
      setIsDayLocked(data.status === "Reconciled"); // Assuming status determines if day is locked
    } catch (error) {
      console.error("Failed to fetch reconciliation data:", error);
      toast({
        title: "Error",
        description: "Failed to load reconciliation data.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReconciliation(false);
    }
  }, [user.id, toast]);

  useEffect(() => {
    fetchSummaryData();
    fetchTaskStatusData();
    fetchTransactionsData();
    fetchReconciliationData();
  }, [
    fetchSummaryData,
    fetchTaskStatusData,
    fetchTransactionsData,
    fetchReconciliationData,
  ]);

  const reconciliationDifference = React.useMemo(() => {
    return systemExpectedCash - agentEnteredCash;
  }, [systemExpectedCash, agentEnteredCash]);

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
      if (!user.id || !user.businessId) return;

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
            const errorData = await response.json().catch(() => ({ message: "Failed to add transaction" }));
            toast({
              title: "Error",
              description: errorData.message || "Failed to add transaction.",
              variant: "destructive",
            });
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }
        }

        // This toast will be displayed only if all transactions are successfully processed.
        const description = chargeTransaction
          ? `Successfully added a ${mainTransaction.type} of ${mainTransaction.amount} and a Charge of ${chargeTransaction.amount}.`
          : `Successfully added a ${mainTransaction.type} of ${mainTransaction.amount}.`;

        toast({
          title: `${mainTransaction.type} Added`,
          description: description,
        });

        // Re-fetch all relevant data to update the dashboard
        fetchTransactionsData();
        fetchSummaryData();
        fetchReconciliationData();
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
        setIsFormOpen(false);
        setCurrentTransactionType(null);
      }
    },
    [
      user.id,
      user.businessId,
      toast,
      fetchTransactionsData,
      fetchSummaryData,
      fetchReconciliationData,
    ]
  );

  return (
    <>
      <header className="flex items-center justify-between p-4 bg-white border-b dark:bg-gray-800 dark:border-gray-700">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          Welcome, {user.name}
        </h1>
      </header>
      <div className="p-8 text-gray-800 dark:text-gray-200">
        {/* Grid for Summary, Task Status, Reconciliation, Notifications */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* A. Agent – Top Summary Cards */}
          <div className="md:col-span-2 xl:col-span-3 py-4 px-6 rounded-lg shadow-md bg-white dark:bg-gray-800">
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
          <div className="py-4 px-6 rounded-lg shadow-md bg-white dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-4">Daily Task Status</h3>
            {isLoadingTaskStatus ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Loading task status...
              </p>
            ) : (
              <AgentDailyTaskStatus status={taskStatusData} />
            )}
          </div>

          {/* E. Agent – Reconciliation Section (End of Day) */}
          <div className="py-4 px-6 rounded-lg shadow-md bg-white dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-4">
              Reconciliation (End of Day)
            </h3>
            {isLoadingReconciliation ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Loading reconciliation data...
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="systemExpectedCash">
                    System Expected Cash
                  </Label>
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
            )}
            <Button
              className="mt-6 w-full"
              disabled={isDayLocked}
              onClick={() => {
                // TODO: Implement API call to lock the day
                toast({
                  title: "Day Locked",
                  description: "Day submitted and locked for reconciliation.",
                });
                setIsDayLocked(true); // Optimistic UI update
              }}
            >
              🔒 Submit & Lock Day
            </Button>
          </div>
        </div>
      </div>

      {/* D. Agent – Today’s Transactions (Full width, separate from the above grid) */}
      <div className="mt-6">
        <div className="py-4 px-6 rounded-lg shadow-md bg-white dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-4">Today’s Transactions</h3>
          {isLoadingTransactions ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Loading transactions...
            </p>
          ) : (
            <AgentTransactionsTable
              transactions={transactionsData}
              user={user}
              onTransactionUpdate={fetchTransactionsData}
            />
          )}
        </div>
      </div>

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
            {/* <Button
              className="w-full"
              onClick={() => {
                setCurrentTransactionType("Charge");
                setIsFormOpen(true);
                setIsAddTransactionDialogOpen(false);
              }}
            >
              Add Charge
            </Button> */}
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
    </>
  );
};

export default AgentDashboardContent;
