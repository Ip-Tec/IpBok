"use client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "@/lib/types";
import { useEffect, useState, Suspense } from "react";
import SideNav from "@/components/dashboards/SideNav";
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  FileCheck,
  FileText,
  Settings,
  Menu,
  ShieldAlert,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import TrialProtectionBanner from "@/components/SubscriptionBanner";

const ownerSidebarNavLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-7 h-7" />,
  },
  {
    name: "Agents",
    href: "/dashboard/agents",
    icon: <Users className="w-7 h-7" />,
  },
  {
    name: "Transaction",
    href: "/dashboard/transactions",
    icon: <ArrowRightLeft className="w-7 h-7" />,
  },
  {
    name: "Accounting",
    href: "/dashboard/accounting",
    icon: <LayoutDashboard className="w-7 h-7" />,
  },
  {
    name: "Reconciliation",
    href: "/dashboard/reconciliation",
    icon: <FileCheck className="w-7 h-7" />,
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: <FileText className="w-7 h-7" />,
  },
  {
    name: "Setting",
    href: "/dashboard/settings",
    icon: <Settings className="w-7 h-7" />,
  },
  {
    name: "Requests",
    href: "/dashboard/requests",
    icon: <ArrowRightLeft className="w-7 h-7" />,
  },
];

const personalSidebarNavLinks = [
  {
    name: "Personal Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-7 h-7" />,
  },
  {
    name: "My Transactions",
    href: "/dashboard/transactions",
    icon: <ArrowRightLeft className="w-7 h-7" />,
  },
  {
    name: "Personal Accounts",
    href: "/dashboard/accounting",
    icon: <LayoutDashboard className="w-7 h-7" />,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="w-7 h-7" />,
  },
];

const adminSidebarNavLinks = [
  {
    name: "Admin Console",
    href: "/admin",
    icon: <ShieldAlert className="w-7 h-7 text-primary font-bold" />,
  },
  ...ownerSidebarNavLinks,
];

const agentSidebarNavLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-7 h-7" />,
  },
  {
    name: "Transaction",
    href: "/dashboard/transactions",
    icon: <ArrowRightLeft className="w-7 h-7" />,
  },
  {
    name: "Reconciliation",
    href: "/dashboard/reconciliation",
    icon: <FileCheck className="w-7 h-7" />,
  },
  {
    name: "Setting",
    href: "/dashboard/settings",
    icon: <Settings className="w-7 h-7" />,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteBusinessId = searchParams.get("inviteBusinessId");
  const [subStatus, setSubStatus] = useState<string>("TRIAL");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((res) => res.json())
      .then((data) => setSubStatus(data.status))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

    const user = session.user as User;

    // Handle Invite Linking for Google Users (who didn't go through /api/auth/register)
    if (inviteBusinessId && !user.businessId) {
      fetch("/api/agents/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: inviteBusinessId }),
      }).then((res) => {
        if (res.ok) {
          update(); // Refresh session to get new role/businessId
          router.replace("/dashboard"); // Clean up URL
        }
      });
    }

    // Check for Onboarding
    // ONLY Owners without a business type go to onboarding
    if (user.role.toUpperCase() === "OWNER" && !user.businessType) {
      router.push("/onboarding");
    }
  }, [session, status, router, inviteBusinessId, update]);

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
  const isOwner = user.role.toUpperCase() === "OWNER";
  const isAdmin =
    user.role.toUpperCase() === "SUPERADMIN" ||
    user.role.toUpperCase() === "SUPPORT";
  const businessType = user.businessType;

  let navLinks = isAdmin
    ? adminSidebarNavLinks
    : isOwner
      ? businessType === "PERSONAL"
        ? personalSidebarNavLinks
        : ownerSidebarNavLinks
      : agentSidebarNavLinks;

  if (isOwner && !businessType) {
    return null;
  }

  const isExpired = subStatus === "EXPIRED";
  const finalNavLinks = isExpired
    ? navLinks.filter((l) => l.href.includes("settings"))
    : navLinks;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
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
