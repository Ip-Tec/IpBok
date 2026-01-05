"use client";
import React, { useRef } from "react";
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
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 md:w-[45%] w-full p-6">
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
    <div className="bg-white rounded-lg shadow dark:bg-gray-800 md:w-[45%] w-full">
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

import UserProfileForm from "./UserProfileForm";
import PasswordManagementForm from "./PasswordManagementForm";
import TransactionSettingsForm from "./TransactionSettingsForm";

const OwnerSettingsView = () => {
  return (
    <div className="p-8">
      <header className="pb-4 border-b">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Manage your account and application settings.
        </p>
      </header>

      <div className="mt-8 space-y-8 flex flex-wrap justify-start items-center gap-8">
        {/* Business Information Section */}
        <BusinessInformationForm />

        {/* User Profile Section */}
        <UserProfileForm />

        {/* Password Management Section */}
        <PasswordManagementForm />

        {/* Transaction Settings Section */}
        <TransactionSettingsForm />

        {/* Theme Settings Section */}
        <div className="bg-white rounded-lg shadow dark:bg-gray-800 w-full">
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
