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
  } else {
    // Other roles get the standard settings view (profile, password, theme)
    return <AgentSettingsView />;
  }
};

export default SettingsPage;
