"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  CreditCard,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const navLinks = [
  { name: "Business Dashboard", href: "/dashboard", icon: ArrowLeftRight },
  { name: "Global Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Manage Businesses", href: "/admin/businesses", icon: Building2 },
  { name: "User Directory", href: "/admin/users", icon: Users },
  { name: "Pricing Plans", href: "/admin/pricing", icon: CreditCard }, // Added this
  { name: "System Logs", href: "/admin/logs", icon: ShieldAlert },
  { name: "Global Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      status === "authenticated" &&
      session.user.role !== "SUPERADMIN" &&
      session.user.role !== "SUPPORT"
    ) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        Loading Admin Console...
      </div>
    );
  }

  if (
    !session ||
    (session.user.role !== "SUPERADMIN" && session.user.role !== "SUPPORT")
  ) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border">
        <div className="p-6 flex items-center space-x-2 border-b border-border">
          <ShieldAlert className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">
            Admin Console
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isActive ? "" : "group-hover:text-primary",
                  )}
                />
                <span className="font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:bg-destructive/10"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <span className="font-bold">Admin Console</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-background">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <span className="text-xl font-bold">Admin Menu</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-4 p-4 rounded-xl hover:bg-muted font-medium"
              >
                <link.icon className="w-6 h-6" />
                <span>{link.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
