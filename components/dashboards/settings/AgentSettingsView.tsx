"use client";
import React from "react";
import UserProfileForm from "./UserProfileForm";
import PasswordManagementForm from "./PasswordManagementForm";
import TransactionSettingsForm from "./TransactionSettingsForm";
import { ThemeToggle } from "@/components/ThemeToggle";

const AgentSettingsView = () => {
  return (
    <div className="p-8">
      <header className="pb-4 border-b">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Manage your account settings.
        </p>
      </header>

      <div className="mt-8 space-y-8 flex flex-wrap justify-start items-center gap-8">
        {/* User Profile Section */}
        <UserProfileForm />

        {/* Password Management Section */}
        <PasswordManagementForm />

        {/* Transaction Settings Section */}
        <TransactionSettingsForm />

        {/* Theme Settings Section */}
        <div className="bg-card rounded-lg shadow w-full">
          <div className="p-6">
            <h2 className="text-lg font-semibold">Theme Settings</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Customize the look and feel of the application.
            </p>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm">Toggle light and dark mode</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentSettingsView;
