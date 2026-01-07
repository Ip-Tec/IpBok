"use client";
import React, { useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User } from "@/src/generated";

// Helper function to update user data
const updateUser = async ({
  userId,
  data,
}: {
  userId: string;
  data: any;
}): Promise<User> => {
  const res = await fetch(`/api/user/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update user data");
  }
  return res.json();
};

const UserProfileForm = () => {
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (newData: any) =>
      updateUser({ userId: userId!, data: newData }),
    onSuccess: async (data) => {
      toast.success("Profile updated successfully!");
      // Update the session
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          email: data.email,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
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
    const newData = {
      firstName: firstNameRef.current?.value,
      lastName: lastNameRef.current?.value,
      email: emailRef.current?.value,
    };
    mutation.mutate(newData);
  };

  const [firstName, lastName] = session?.user?.name?.split(" ") || ["", ""];

  return (
    <div className="bg-card rounded-lg shadow md:w-[45%] w-full">
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">User Profile</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Update your personal information.
          </p>
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  ref={firstNameRef}
                  defaultValue={firstName}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  ref={lastNameRef}
                  defaultValue={lastName}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                ref={emailRef}
                defaultValue={session?.user?.email || ""}
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

export default UserProfileForm;
