"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const updateUser = async ({
  userId,
  transactionsPerPage,
}: {
  userId: string;
  transactionsPerPage: number;
}) => {
  const res = await fetch(`/api/user/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transactionsPerPage }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update settings");
  }
  return res.json();
};

const TransactionSettingsForm = () => {
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();
  const [transactionsPerPage, setTransactionsPerPage] = useState(
    session?.user?.transactionsPerPage?.toString() || "10"
  );

  const mutation = useMutation({
    mutationFn: (newTransactionsPerPage: number) =>
      updateUser({
        userId: session!.user.id,
        transactionsPerPage: newTransactionsPerPage,
      }),
    onSuccess: async () => {
      toast.success("Settings updated successfully!");
      await update();
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unknown error occurred.");
    },
  });

  const handleSave = () => {
    mutation.mutate(parseInt(transactionsPerPage, 10));
  };

  return (
    <div className="bg-white rounded-lg shadow dark:bg-gray-800 md:w-[45%] w-full">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Transaction Settings</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Customize your transaction view settings.
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="transactions-per-page">
              Transactions per Page
            </Label>
            <Select
              value={transactionsPerPage}
              onValueChange={setTransactionsPerPage}
            >
              <SelectTrigger id="transactions-per-page">
                <SelectValue placeholder="Select a value" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionSettingsForm;
