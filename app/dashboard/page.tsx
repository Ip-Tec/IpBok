"use client";
import { useSession } from "next-auth/react";
import { User } from "@/lib/types";
import OwnerDashboardContent from "@/components/dashboards/OwnerDashboardContent";
import AgentDashboardContent from "@/components/dashboards/AgentDashboardContent";
import PersonalDashboardContent from "@/components/dashboards/PersonalDashboardContent";
import RetailDashboardContent from "@/components/dashboards/RetailDashboardContent";

export default function DashboardPage() {
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
    user.businessType === "PERSONAL" ? (
      <PersonalDashboardContent {...user} />
    ) : user.businessType === "RETAIL" ? (
      <RetailDashboardContent {...user} />
    ) : (
      <OwnerDashboardContent {...user} />
    )
  ) : (
    <AgentDashboardContent {...user} />
  );
}
