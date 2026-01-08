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
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fetchStatus = () => {
    setLoading(true);
    fetch("/api/subscription/status")
      .then((res) => res.json())
      .then(setSubscription)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: subscription.planId }),
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert(
          "Failed to initialize payment: " + (data.error || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("An error occurred while initiating upgrade.");
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
        alert("Payment verified successfully!");
        fetchStatus();
      } else {
        alert("Verification failed. Please check the reference.");
      }
    } catch (error) {
      alert("Error during verification.");
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

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              {!isActive && (
                <Button
                  size="lg"
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="flex-1 py-6 text-lg font-bold shadow-xl shadow-primary/20"
                >
                  {upgrading
                    ? "Initializing..."
                    : isTrial
                      ? "Upgrade to Active"
                      : "Renew Subscription"}
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                onClick={handleManualVerify}
                disabled={verifying}
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

          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <p className="text-xs text-primary font-medium leading-relaxed uppercase tracking-wider">
              Paystack Test Mode Active
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Use Paystack test cards to simulate successful transactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
