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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
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
    return null;
  }

  const user = session.user as User;
  const isOwner = user.role.toLowerCase() === "owner";

  const navLinks = isOwner ? ownerSidebarNavLinks : agentSidebarNavLinks;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <SideNav
        user={user}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sidebarNavLinks={navLinks}
      />
      <main className="flex-1 flex flex-col lg:ml-64">
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-500 rounded-md hover:text-gray-600 focus:outline-none focus:ring"
          >
            <Menu className="w-6 h-6" />
          </button>
          <NotificationBell />
        </header>
        <div className="flex-1 p-4">{children}</div>
      </main>
    </div>
  );
}
