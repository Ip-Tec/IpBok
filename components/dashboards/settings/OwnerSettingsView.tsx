"use client";
import React, { useRef } from "react";
import { CreditCard } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { Business } from "@/src/generated";

// Helper function to fetch business data
const getBusiness = async (businessId: string): Promise<Business> => {
  const res = await fetch(`/api/business/${businessId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch business data");
  }
  return res.json();
};

// Helper function to update business data
const updateBusiness = async ({
  businessId,
  data,
}: {
  businessId: string;
  data: Partial<Business>;
}): Promise<Business> => {
  const res = await fetch(`/api/business/${businessId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update business data");
  }
  return res.json();
};

const BusinessInformationForm = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const businessId = session?.user?.businessId;

  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const { data: businessData, isLoading } = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => getBusiness(businessId!),
    enabled: !!businessId,
  });

  const mutation = useMutation({
    mutationFn: (newData: Partial<Business>) =>
      updateBusiness({ businessId: businessId!, data: newData }),
    onSuccess: (data) => {
      queryClient.setQueryData(["business", businessId], data);
      toast.success("Business information updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unknown error occurred.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      toast.error("Could not find business ID. Please try logging in again.");
      return;
    }
    const newData = {
      name: nameRef.current?.value || "",
      address: addressRef.current?.value || "",
      phone: phoneRef.current?.value || "",
    };
    mutation.mutate(newData);
  };

  if (session && !businessId) {
    return (
      <div className="bg-card rounded-lg shadow md:w-[45%] w-full p-6">
        <h2 className="text-lg font-semibold">Business Information</h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          No business associated with this account was found. Please contact
          support.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-card rounded-lg shadow md:w-[45%] w-full">
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Business Information</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Update your business details.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                ref={nameRef}
                defaultValue={businessData?.name || ""}
              />
            </div>
            <div>
              <Label htmlFor="address">Business Address</Label>
              <Input
                id="address"
                ref={addressRef}
                defaultValue={businessData?.address || ""}
              />
            </div>
            <div>
              <Label htmlFor="phone">Business Phone</Label>
              <Input
                id="phone"
                ref={phoneRef}
                defaultValue={businessData?.phone || ""}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

// Helper to fetch subscription status
const getSubscriptionStatus = async () => {
  const res = await fetch("/api/subscription/status");
  if (!res.ok) throw new Error("Failed to fetch subscription status");
  return res.json();
};

import { cn } from "@/lib/utils";

const SubscriptionInfoCard = () => {
  const { data: sub, isLoading } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: getSubscriptionStatus,
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow md:w-[45%] w-full p-6 space-y-4 animate-pulse">
        <div className="h-6 w-1/3 bg-muted rounded"></div>
        <div className="h-4 w-2/3 bg-muted rounded"></div>
      </div>
    );
  }

  // Fallback if error or no data
  const planName = sub?.planName || "Unknown";
  const status = sub?.status || "UNKNOWN";
  const isTrial = status === "TRIAL";
  const isExpired = status === "EXPIRED";
  const isActive = status === "ACTIVE";

  return (
    <div className="bg-card rounded-lg shadow md:w-[45%] w-full p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" /> Subscription
        </h2>
        <span
          className={cn(
            "text-xs px-2 py-1 rounded-full font-bold border",
            isActive
              ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
              : isExpired
                ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400"
                : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
          )}
        >
          {status}
        </span>
      </div>

      <div className="space-y-1">
        <p className="font-medium text-lg">{planName} Plan</p>
        {isTrial && (
          <p className="text-sm text-muted-foreground">
            Trial ends in{" "}
            <span className="font-bold text-foreground">
              {sub.daysRemaining} days
            </span>
          </p>
        )}
        {isActive && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Account represents a verified business.
          </p>
        )}
        {isExpired && (
          <p className="text-sm text-destructive font-medium">
            Your plan has expired. Please renew now.
          </p>
        )}
      </div>

      <Button
        asChild
        className="w-full mt-4"
        variant={isExpired ? "destructive" : "outline"}
      >
        <a href="/dashboard/settings/billing">
          {isExpired
            ? "Renew Now"
            : isTrial
              ? "Upgrade Plan"
              : "Manage Subscription"}
        </a>
      </Button>
    </div>
  );
};

import UserProfileForm from "./UserProfileForm";
import PasswordManagementForm from "./PasswordManagementForm";
import TransactionSettingsForm from "./TransactionSettingsForm";

const OwnerSettingsView = () => {
  const { data: session } = useSession();
  return (
    <div className="p-2">
      <header className="pb-4 border-b bg-card p-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Manage your account and application settings.
        </p>
      </header>

      <div className="p-8 mt-8 space-y-8 flex flex-wrap justify-start items-center gap-8">
        {/* Business Information Section */}
        {session?.user.businessType !== "PERSONAL" && (
          <BusinessInformationForm />
        )}

        {/* Subscription & Billing Section */}
        <SubscriptionInfoCard />

        {/* User Profile Section */}
        <UserProfileForm />

        {/* Password Management Section */}
        <PasswordManagementForm />

        {/* Transaction Settings Section */}
        <TransactionSettingsForm />

        {/* Theme Settings Section */}
        <div className="bg-card rounded-lg shadow-lg w-full">
          <div className="p-6">
            <h2 className="text-lg font-semibold">Theme Settings</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Customize the look and feel of the application.
            </p>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm">Toggle light and dark mode</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerSettingsView;
