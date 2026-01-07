"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";
import OwnerAgentsView from "@/components/dashboards/agents/OwnerAgentsView";
import AgentProfileView from "@/components/dashboards/agents/AgentProfileView";

export default function AgentsPage() {
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

  // Owners see the list of all agents
  // Agents see their own profile page
  return user.role.toLowerCase() === "owner" ? (
    <OwnerAgentsView />
  ) : (
    <AgentProfileView user={user} />
  );
}
