"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";

const OwnerSettingsView = () => {
  return (
    <div className="p-8">
      <header className="pb-4 border-b">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Manage your account and application settings.
        </p>
      </header>

      <div className="mt-8 space-y-8">
        {/* User Profile Section */}
        <div className="bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="p-6">
            <h2 className="text-lg font-semibold">User Profile</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Update your personal information.
            </p>
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Doe" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john.doe@example.com" />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </div>
        </div>

        {/* Password Management Section */}
        <div className="bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="p-6">
            <h2 className="text-lg font-semibold">Password Management</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Change your password.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button>Change Password</Button>
            </div>
          </div>
        </div>

        {/* Theme Settings Section */}
        <div className="bg-white rounded-lg shadow dark:bg-gray-800">
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

export default OwnerSettingsView;