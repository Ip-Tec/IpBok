"use client";
import { useSession } from "next-auth/react";
import { User } from "@/lib/types";
import OwnerTransactionsView from "@/components/dashboards/transactions/OwnerTransactionsView";
import AgentTransactionsView from "@/components/dashboards/transactions/AgentTransactionsView";

export default function TransactionsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!session) {
    return null; // The layout will redirect
  }

  const user = session.user as User;

  return user.role.toLowerCase() === "owner" ? (
    <OwnerTransactionsView />
  ) : (
    <AgentTransactionsView user={user} />
  );
}
