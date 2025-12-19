"use client";

import React from "react";
import { useSession } from "next-auth/react";
import OwnerSettingsView from "@/components/dashboards/settings/OwnerSettingsView";

const SettingsPage = () => {
  const { data: session } = useSession();

  if (!session) {
    return <div>Loading...</div>;
  }

  return <OwnerSettingsView />;
};

export default SettingsPage;
