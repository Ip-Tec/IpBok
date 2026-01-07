"use client";
import React, { useRef } from "react";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Helper function to update password
const updatePassword = async ({
  userId,
  data,
}: {
  userId: string;
  data: any;
}) => {
  const res = await fetch(`/api/user/${userId}/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update password");
  }
  return res.json();
};

const PasswordManagementForm = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (newData: any) =>
      updatePassword({ userId: userId!, data: newData }),
    onSuccess: () => {
      toast.success("Password updated successfully!");
      // Clear input fields
      if (currentPasswordRef.current) currentPasswordRef.current.value = "";
      if (newPasswordRef.current) newPasswordRef.current.value = "";
      if (confirmPasswordRef.current) confirmPasswordRef.current.value = "";
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unknown error occurred.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Could not find user ID. Please try logging in again.");
      return;
    }
    if (newPasswordRef.current?.value !== confirmPasswordRef.current?.value) {
      toast.error("New passwords do not match.");
      return;
    }
    const newData = {
      currentPassword: currentPasswordRef.current?.value,
      newPassword: newPasswordRef.current?.value,
    };
    mutation.mutate(newData);
  };

  return (
    <div className="bg-card rounded-lg shadow md:w-[45%] w-full">
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Password Management</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Change your password.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                ref={currentPasswordRef}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" ref={newPasswordRef} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                ref={confirmPasswordRef}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PasswordManagementForm;
