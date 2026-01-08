"use client";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import OwnerReportsView from "@/components/dashboards/reports/OwnerReportsView";
import { User } from "@/lib/types";

const ReportsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    const user = session.user as User;
    if (user.businessType === "PERSONAL") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Reports...
      </div>
    );
  }

  const user = session.user as User;
  if (user.businessType === "PERSONAL") return null;

  return <OwnerReportsView />;
};

export default ReportsPage;
