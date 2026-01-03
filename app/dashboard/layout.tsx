"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";
import { useEffect, useState } from "react";
import SideNav from "@/components/dashboards/SideNav";
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  FileCheck,
  FileText,
  Settings,
  Menu,
  PlusCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import TrialProtectionBanner from "@/components/SubscriptionBanner";

const ownerSidebarNavLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: "Agents",
    href: "/dashboard/agents",
    icon: <Users className="w-5 h-5" />,
  },
  {
    name: "Transaction",
    href: "/dashboard/transactions",
    icon: <ArrowRightLeft className="w-5 h-5" />,
  },
  {
    name: "Accounting",
    href: "/dashboard/accounting",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: "Reconciliation",
    href: "/dashboard/reconciliation",
    icon: <FileCheck className="w-5 h-5" />,
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    name: "Setting",
    href: "/dashboard/settings",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    name: "Requests",
    href: "/dashboard/requests",
    icon: <ArrowRightLeft className="w-5 h-5" />,
  },
];

const agentSidebarNavLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: "Transaction",
    href: "/dashboard/transactions",
    icon: <ArrowRightLeft className="w-5 h-5" />,
  },
  {
    name: "Reconciliation",
    href: "/dashboard/reconciliation",
    icon: <FileCheck className="w-5 h-5" />,
  },
  {
    name: "Setting",
    href: "/dashboard/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subStatus, setSubStatus] = useState<string>("TRIAL");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/subscription/status")
      .then(res => res.json())
      .then(data => setSubStatus(data.status))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    
    // Check for Onboarding
    const user = session.user as User;
    // If Owner and no Business Type, send to Onboarding
    if (user.role === 'OWNER' && !user.businessType) {
        router.push("/onboarding");
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
    return null;
  }

  const user = session.user as User;
  const isOwner = user.role.toLowerCase() === "owner";
  // Assuming businessType is added to User type or we cast it
  const businessType = user.businessType;

  let navLinks = isOwner ? ownerSidebarNavLinks : agentSidebarNavLinks;

  // Modular Logic: Filter links based on Business Type
  if (businessType === 'CORPORATE') {
       // Corporate: Hide Agents/Reconciliation if they don't apply, or show Corp specific
       // For now, let's keep it simple or user specific request
       // navLinks = navLinks.filter(link => ...);
  } else if (businessType === 'POS') {
       // POS: Maybe hide "Reports" or "Accounting" if they are simple?
       // Currently user claimed "every tool" is shown.
       // Verification: Owner links includes Accounting, Reconciliation, Reports.
  }
  
  if (isOwner && !businessType) {
      // This will be handled by the effect, but we can return null to avoid flash
     return null; 
  }

  // Feature Locking Logic: If EXPIRED, only show Settings/Billing
  const isExpired = subStatus === "EXPIRED";
  const finalNavLinks = isExpired 
    ? navLinks.filter(l => l.href.includes("settings"))
    : navLinks;


  return (
    <div className="flex h-screen bg-background text-foreground">
      <TrialProtectionBanner />
      <SideNav
        user={user}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sidebarNavLinks={finalNavLinks}
      />
      <main className="flex-1 flex flex-col lg:ml-64">
        <header className="flex items-center justify-between p-4 bg-card border-b border-border lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-500 rounded-md hover:text-gray-600 focus:outline-none focus:ring"
          >
            <Menu className="w-6 h-6" />
          </button>
          <NotificationBell />
        </header>
        <div className="flex-1 overflow-y-auto h-full">{children}</div>
      </main>
    </div>
  );
}
