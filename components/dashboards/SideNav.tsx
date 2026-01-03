"use client";
import { NotificationBell } from "@/components/NotificationBell";
import { User } from "@/lib/types";
import React from "react";
import { LogOut, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

interface SideNavProps {
  user: User;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  sidebarNavLinks: {
    name: string;
    href: string;
    icon: React.ReactNode;
  }[];
}

interface NavLinksProps {
  sidebarNavLinks: {
    name: string;
    href: string;
    icon: React.ReactNode;
  }[];
}

const NavLinks = ({ sidebarNavLinks }: NavLinksProps) => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col justify-between flex-1 mt-8">
      <ul className="space-y-1">
        {sidebarNavLinks.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className={cn(
                "flex items-center px-4 py-4 text-lg font-medium rounded-md transition-colors",
                "text-muted-foreground hover:bg-accent/10 hover:text-accent-foreground",
                pathname === link.href 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : ""
              )}
            >
              {link.icon}
              <span className="ml-4">{link.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <ul>
        <li>
          <button
            onClick={() => signOut()}
            className="flex items-center w-full px-4 py-4 text-lg font-medium text-left text-destructive rounded-md hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-7 h-7" />
            <span className="ml-4">Logout</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};

const SideNav = ({
  user,
  isSidebarOpen,
  setIsSidebarOpen,
  sidebarNavLinks,
}: SideNavProps) => {
  return (
    <>
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/80 bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col w-80 md:w-64 lg:w-64 px-4 py-8 overflow-y-auto bg-card border-r border-border transition-transform lg:translate-x-0 duration-300",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">
              {user.name}
            </h2>
            <NotificationBell />
          </div>
          <button
            className="p-2 text-gray-500 rounded-md lg:hidden hover:text-gray-600 focus:outline-none focus:ring"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <NavLinks sidebarNavLinks={sidebarNavLinks} />
      </aside>
    </>
  );
};

export default SideNav;
