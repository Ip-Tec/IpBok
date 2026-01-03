"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TrialProtectionBanner() {
  const [subscription, setSubscription] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetch("/api/subscription/status")
      .then(res => res.json())
      .then(setSubscription)
      .catch(console.error);
  }, []);

  if (!subscription || !isVisible) return null;

  const isExpired = subscription.status === "EXPIRED";
  const isTrial = subscription.status === "TRIAL";
  const daysLeft = subscription.daysRemaining;

  // Only show for TRIAL (if few days left) or EXPIRED
  if (isTrial && daysLeft > 7) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-[100] p-4 flex items-center justify-between shadow-2xl transition-all duration-500",
      isExpired ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"
    )}>
      <div className="flex items-center space-x-3 max-w-7xl mx-auto w-full">
        <AlertTriangle className="w-6 h-6 animate-bounce" />
        <div className="flex-1">
          <p className="font-bold text-sm md:text-base">
            {isExpired 
              ? `Your free trial for ${subscription.planName} has EXPIRED.` 
              : `Your ${subscription.planName} trial ends in ${daysLeft} days.`
            }
          </p>
          <p className="text-xs opacity-90">
            {isExpired 
              ? "Upgrade now to restore access to your business tools." 
              : "Subscribe now to avoid any interruption in service."
            }
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="secondary" size="sm" asChild className="hidden md:flex">
             <Link href="/dashboard/settings/billing">
                <CreditCard className="w-4 h-4 mr-2" /> Upgrade Plan
             </Link>
          </Button>
          <button onClick={() => setIsVisible(false)} className="hover:opacity-70">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
