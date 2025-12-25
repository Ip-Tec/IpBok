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
      <ul>
        {sidebarNavLinks.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-700",
                pathname === link.href ? "bg-gray-700" : ""
              )}
            >
              {link.icon}
              <span className="ml-3">{link.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <ul>
        <li>
          <button
            onClick={() => signOut()}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-left text-red-500 rounded-md hover:bg-gray-700"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3">Logout</span>
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
          "fixed inset-y-0 left-0 z-30 flex flex-col w-64 px-4 py-8 overflow-y-auto bg-white border-r transform lg:translate-x-0 dark:bg-gray-800 dark:border-gray-700",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
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