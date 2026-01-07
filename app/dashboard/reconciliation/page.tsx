"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";
import OwnerReconciliationView from "@/components/dashboards/reconciliation/OwnerReconciliationView";
import AgentReconciliationView from "@/components/dashboards/reconciliation/AgentReconciliationView";

export default function ReconciliationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  if (user.businessType === "PERSONAL") {
    router.push("/dashboard");
    return null;
  }

  return user.role.toLowerCase() === "owner" ? (
    <OwnerReconciliationView />
  ) : (
    <AgentReconciliationView user={user} />
  );
}
