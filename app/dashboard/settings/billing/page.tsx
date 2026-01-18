"use client";
import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [months, setMonths] = useState(1);

  const fetchStatus = () => {
    setLoading(true);
    fetch("/api/subscription/status")
      .then((res) => res.json())
      .then((data) => {
        setSubscription(data);
        setSelectedPlanId(data.planId);
      });

    fetch("/api/admin/pricing") // We should probably make a public pricing API, but this works if user is auth'd
      .then((res) => res.json())
      .then((data) => {
        // Only show paid plans as options if they are on personal, or show all
        setAllPlans(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleUpgrade = async () => {
    const targetPlanId = selectedPlanId || subscription?.planId;
    try {
      setUpgrading(true);
      if (!targetPlanId) {
        toast.error("Please select a plan to continue.");
        setUpgrading(false);
        return;
      }
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: targetPlanId,
          months: months,
        }),
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.error(
          "Failed to initialize payment: " + (data.error || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("An error occurred while initiating upgrade.");
    } finally {
      setUpgrading(false);
    }
  };

  const handleManualVerify = async () => {
    const reference = prompt(
      "Please enter your Paystack Transaction Reference:",
    );
    if (!reference) return;

    try {
      setVerifying(true);
      const res = await fetch(`/api/payment/callback?reference=${reference}`);
      if (res.ok) {
        toast.success("Payment verified successfully!");
        fetchStatus();
      } else {
        toast.error("Verification failed. Please check the reference.");
      }
    } catch (error) {
      toast.error("Error during verification.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center animate-pulse">
        Loading Subscription Data...
      </div>
    );

  if (!subscription) return null;

  const selectedPlan =
    allPlans.find((p) => p.id === selectedPlanId) || subscription;
  const isTrial = subscription.status === "TRIAL";
  const isExpired = subscription.status === "EXPIRED";
  const isActive = subscription.status === "ACTIVE";

  // Calculate percentage of trial used (roughly, assuming 30-60 day starts)
  const totalTrialDays = subscription.planName === "POS" ? 60 : 30;
  const percentUsed = Math.min(
    100,
    Math.max(
      0,
      ((totalTrialDays - subscription.daysRemaining) / totalTrialDays) * 100,
    ),
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Billing & Subscription
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your current plan and pay for your subscription.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold uppercase">
                    {subscription.planName} Package
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Current Status:
                    <span
                      className={cn(
                        "ml-2 font-bold",
                        isActive
                          ? "text-green-500"
                          : isExpired
                            ? "text-destructive"
                            : "text-primary",
                      )}
                    >
                      {subscription.status}
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold">
                  ₦{subscription.monthlyPrice.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  per month
                </p>
              </div>
            </div>

            {isTrial && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
                    Free Trial Progress
                  </span>
                  <span>{subscription.daysRemaining} days left</span>
                </div>
                <Progress value={percentUsed} className="h-2" />
                <p className="text-xs text-muted-foreground italic">
                  Your trial ends on{" "}
                  {new Date(subscription.trialEndsAt).toLocaleDateString()}.
                </p>
              </div>
            )}

            {isActive && (
              <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-green-700 dark:text-green-400">
                    Subscription Active
                  </h4>
                  <p className="text-sm text-green-700/80 dark:text-green-400/80">
                    Your next payment is due on{" "}
                    {new Date(
                      subscription.subscriptionEndsAt,
                    ).toLocaleDateString()}
                    .
                  </p>
                </div>
              </div>
            )}

            {isExpired && (
              <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-bold text-destructive">
                    Subscription Required
                  </h4>
                  <p className="text-sm text-destructive/80">
                    Your trial has expired. Please upgrade your account to
                    restore access to all features.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-10 flex flex-col gap-6">
              {/* Plan Selection (Dynamic) */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Select Subscription Plan
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allPlans
                    .filter((p) => p.businessType !== "PERSONAL")
                    .map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group",
                          selectedPlanId === plan.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border bg-card hover:border-primary/50",
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg">
                              {plan.businessType}
                            </p>
                            <p className="text-xl font-black text-primary">
                              ₦{plan.monthlyPrice.toLocaleString()}
                              <span className="text-xs font-normal text-muted-foreground">
                                /mo
                              </span>
                            </p>
                          </div>
                          {selectedPlanId === plan.id && (
                            <div className="bg-primary text-primary-foreground p-1 rounded-full">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-tighter">
                          {plan.trialDays} Day Trial included
                        </p>
                      </button>
                    ))}
                </div>
              </div>

              {/* Interval Selection (Always visible now for top-ups) */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Payment Interval
                </Label>
                <div className="bg-muted/50 p-1 rounded-lg flex">
                  {[
                    { label: "1 Month", value: 1 },
                    { label: "6 Months", value: 6 },
                    { label: "1 Year", value: 12 },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setMonths(option.value)}
                      className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                        months === option.value
                          ? "bg-background shadow text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={handleUpgrade}
                  disabled={
                    upgrading ||
                    !selectedPlanId ||
                    selectedPlan?.monthlyPrice === 0
                  }
                  className="w-full py-8 text-xl font-black shadow-2xl shadow-primary/30 transition-transform active:scale-95 bg-primary hover:bg-primary/90"
                >
                  <CreditCard className="w-6 h-6 mr-3" />
                  {upgrading
                    ? "Processing..."
                    : `PROCEED TO PAY ₦${((selectedPlan?.monthlyPrice || 0) * months).toLocaleString()}`}
                </Button>
                <p className="text-center text-[10px] text-muted-foreground mt-3 uppercase tracking-widest font-bold opacity-60">
                  Secure Payment Powered by Paystack
                </p>
              </div>

              <Button
                variant="outline"
                size="lg"
                onClick={handleManualVerify}
                disabled={verifying}
                className="w-full"
              >
                {verifying ? "Verifying..." : "Verify Past Payment"}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h4 className="font-bold mb-4 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" /> Plan
              Features
            </h4>
            <ul className="text-sm space-y-3 text-muted-foreground">
              {subscription.planName === "PERSONAL" ? (
                <>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Unlimited Transactions
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Multi-agent Management
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Real-time Accounting
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Daily Reconciliation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Individual tracking
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Income & Expenses
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Basic Reports
                  </li>
                </>
              ) : subscription.planName === "POS" ? (
                <>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Unlimited Transactions
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Advanced Agent Tracking
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Real-time Stock Management
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Daily Reconciliation Reports
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Profit & Loss Analysis
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Multi-location Support
                  </li>
                </>
              ) : (
                // Fallback for SME or other future plans
                <>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Unlimited Transactions
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Full Accounting Suite
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Payroll Management
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Advanced Reporting & Tax
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />{" "}
                    Priority Support
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
