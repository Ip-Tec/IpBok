"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";
import { useEffect } from "react";
import OwnerDashboard from "@/components/dashboards/OwnerDashboard";
import AgentDashboard from "@/components/dashboards/AgentDashboard";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  const user = session.user as User;

  return (
    <div className="min-h-screen">
      {user.role.toLowerCase() === "owner" ? (
        <OwnerDashboard {...user} />
      ) : user.role.toLowerCase() === "agent" ? (
        <AgentDashboard {...user} />
      ) : (
        <div>Unauthorized</div>
      )}
    </div>
  );
}
