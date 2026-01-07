"use client";
import React, { useState } from "react";
import { User } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Lock, AlertTriangle } from "lucide-react";

interface AgentReconciliationViewProps {
  user: User;
}

const AgentReconciliationView = ({ user }: AgentReconciliationViewProps) => {
  const [systemExpectedCash, _setSystemExpectedCash] = useState<number>(1000.0);
  const [agentEnteredCash, setAgentEnteredCash] = useState<number>(0);
  const [isDayLocked, setIsDayLocked] = useState<boolean>(false);
  const { toast } = useToast();

  const reconciliationDifference = React.useMemo(() => {
    return systemExpectedCash - agentEnteredCash;
  }, [systemExpectedCash, agentEnteredCash]);

  const handleSubmit = () => {
    setIsDayLocked(true);
    toast({
      title: "Day Locked",
      description: `Your reconciliation for today has been submitted and locked. Difference: ₦${reconciliationDifference.toLocaleString()}`,
    });
    // In a real app, you would send this data to your backend API
  };

  return (
    <div className="p-4 md:p-8">
      <header className="pb-4 border-b">
        <h1 className="text-3xl font-bold text-accent-foreground">
          End of Day Reconciliation
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Submit your cash totals to reconcile for today.
        </p>
      </header>

      {isDayLocked ? (
        <div className="mt-8 flex flex-col items-center justify-center text-center p-12 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Lock className="w-16 h-16 text-green-500 dark:text-green-400" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Day Locked
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your reconciliation has been submitted for today.
          </p>
        </div>
      ) : (
        <div className="mt-8 max-w-lg mx-auto">
          <div className="p-6 bg-card rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">
              Cash Reconciliation Form
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label htmlFor="systemExpectedCash">System Expected Cash</Label>
                <Input
                  id="systemExpectedCash"
                  type="number"
                  value={systemExpectedCash.toFixed(2)}
                  readOnly
                  className="cursor-not-allowed"
                />
              </div>
              <div>
                <Label htmlFor="agentEnteredCash">Your Actual Cash</Label>
                <Input
                  id="agentEnteredCash"
                  type="number"
                  value={agentEnteredCash}
                  onChange={(e) =>
                    setAgentEnteredCash(parseFloat(e.target.value) || 0)
                  }
                  placeholder="e.g., 1000.00"
                />
              </div>
              <div>
                <Label htmlFor="difference">Difference</Label>
                <Input
                  id="difference"
                  type="number"
                  value={reconciliationDifference.toFixed(2)}
                  readOnly
                  className={`cursor-not-allowed ${
                    reconciliationDifference < 0
                      ? "text-destructive"
                      : "text-green-500"
                  }`}
                />
              </div>
            </div>

            {reconciliationDifference !== 0 && (
              <div className="mt-6 flex items-start p-4 bg-yellow-100 text-yellow-800 rounded-lg">
                <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Attention Required</h3>
                  <p className="text-sm">
                    Your actual cash does not match the system's expected
                    amount. Please double-check your counts.
                  </p>
                </div>
              </div>
            )}

            <Button className="mt-6 w-full" onClick={handleSubmit}>
              <Lock className="w-4 h-4 mr-2" />
              Submit & Lock Day
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentReconciliationView;
