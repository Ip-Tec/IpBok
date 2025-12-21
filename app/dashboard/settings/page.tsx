"use client";

import { useSession } from "next-auth/react";
import OwnerSettingsView from "@/components/dashboards/settings/OwnerSettingsView";
import AgentSettingsView from "@/components/dashboards/settings/AgentSettingsView";

const SettingsPage = () => {
  const { data: session } = useSession();

  if (!session) {
    return <div>Loading...</div>;
  }

  if (session.user?.role === "OWNER") {
    return <OwnerSettingsView />;
  } else if (session.user?.role === "AGENT") {
    return <AgentSettingsView />;
  } else {
    // Fallback or error for unknown roles
    return <div>Unauthorized role.</div>;
  }
};

export default SettingsPage;
