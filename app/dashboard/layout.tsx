"use client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { User } from "@/lib/types";
import { useEffect, useState, Suspense } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
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
  Package,
  ShoppingCart,
  TrendingUp,
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

const retailSidebarNavLinks = [
  {
    name: "Retail Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-7 h-7" />,
    roles: ["OWNER", "MANAGER", "CASHIER"],
  },
  {
    name: "Staff",
    href: "/dashboard/retail/staff",
    icon: <Users className="w-7 h-7" />,
    roles: ["OWNER"],
  },
  {
    name: "Inventory",
    href: "/dashboard/retail/products",
    icon: <Package className="w-7 h-7" />,
    roles: ["OWNER", "MANAGER", "CASHIER"],
  },
  {
    name: "Sales",
    href: "/dashboard/retail/sales",
    icon: <ShoppingCart className="w-7 h-7" />,
    roles: ["OWNER", "MANAGER", "CASHIER"],
  },
  {
    name: "Reports",
    href: "/dashboard/retail/reports",
    icon: <TrendingUp className="w-7 h-7" />,
    roles: ["OWNER", "MANAGER"],
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="w-7 h-7" />,
    roles: ["OWNER"],
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
        <div className="min-h-screen flex items-center justify-center">
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inviteBusinessId = searchParams.get("inviteBusinessId");
  const [subStatus, setSubStatus] = useState<string>("TRIAL");

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
    : businessType === "RETAIL"
      ? retailSidebarNavLinks.filter(l => l.roles.includes(user.role.toUpperCase()))
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
        isSidebarOpen={false}
        setIsSidebarOpen={() => {}}
        sidebarNavLinks={finalNavLinks}
      />
      <main className="flex-1 flex flex-col lg:ml-64 pb-16 lg:pb-0">
        <header className="flex items-center justify-between p-4 bg-card border-b border-border lg:hidden">
          <h1 className="font-bold text-lg truncate">IpBok</h1>
          <NotificationBell />
        </header>
        <div className="flex-1 overflow-y-auto h-full">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-card border-t border-border overflow-x-auto px-2 py-2 lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] hide-scrollbar">
        {finalNavLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-[64px] rounded-md transition-colors gap-1",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center justify-center p-1 rounded-full">
                {link.icon}
              </div>
              <span className={cn(
                "text-[10px] truncate max-w-[64px] text-center",
                isActive ? "font-bold" : "font-medium"
              )}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
