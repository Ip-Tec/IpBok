"use client";

import { useSession } from "next-auth/react";
import AccountingDashboardContent from "@/components/dashboards/AccountingDashboardContent";
import { User } from "@/lib/types";

export default function AccountingDashboardPage() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null; 
  }

  return <AccountingDashboardContent {...(session.user as User)} />;
}
