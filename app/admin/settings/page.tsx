"use client";
import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Settings, ShieldCheck, Database, Globe } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Global Settings</h1>
          <p className="text-muted-foreground italic">
            Platform-wide system configurations and maintenance tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-primary" />
                Security Policies
              </CardTitle>
              <CardDescription>
                Manage global authentication and authorization rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Multi-Factor Authentication (MFA)</span>
                <span className="text-muted-foreground">System Default</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Password Complexity</span>
                <span className="text-muted-foreground">High</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Configure Security
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-primary" />
                System Maintenance
              </CardTitle>
              <CardDescription>
                Database backups and cleanup utilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Last Backup</span>
                <span className="text-muted-foreground">6 hours ago</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Database Status</span>
                <span className="text-green-500 font-bold">HEALTHY</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Run Optimization
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2 text-primary" />
                Regional Settings
              </CardTitle>
              <CardDescription>
                Default currency, timezones, and localization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Default Currency</span>
                <span className="font-bold">NGN (₦)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Primary Timezone</span>
                <span className="text-muted-foreground">GMT+1 (Lagos)</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Update Localization
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-primary" />
                Advanced Variables
              </CardTitle>
              <CardDescription>
                Manage dynamic platform environment variables.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-8">
              <p className="text-sm text-center text-muted-foreground">
                Advanced settings are restricted to SUPERADMIN only.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
