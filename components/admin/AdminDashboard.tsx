"use client";
import React, { useEffect, useState } from "react";
import { 
  Users, 
  Building, 
  Activity, 
  ArrowUpRight, 
  ShieldCheck,
  Search
} from "lucide-react";
import KpiCard from "@/components/dashboards/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading Admin Stats...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Global Overview</h1>
        <p className="text-muted-foreground mt-2">Platform-wide health and business metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Businesses" 
          value={data.stats.totalBusinesses} 
          description="Registered organizations"
          icon={Building}
        />
        <KpiCard 
          title="Total Users" 
          value={data.stats.totalUsers} 
          description="Across all businesses"
          icon={Users}
        />
        <KpiCard 
          title="Daily Volume" 
          value={`₦${data.stats.totalVolumeToday.toLocaleString()}`} 
          description="Across platform"
          icon={Activity}
        />
        <KpiCard 
          title="Active Businesses" 
          value={data.stats.activeBusinesses} 
          description="Activity last 24h"
          icon={ShieldCheck}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Recent Businesses</h3>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/businesses">View All</Link>
            </Button>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-muted text-muted-foreground text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Business</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Users</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.recentBusinesses.map((b: any) => (
                  <tr key={b.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{b.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-semibold">
                        {b.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{b.members} users</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/businesses/${b.id}`}>Manage</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Quick Search</h3>
          <div className="bg-card p-6 rounded-xl border border-border space-y-4">
             <div className="relative">
               <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
               <Input placeholder="Search Users or Businesses..." className="pl-10" />
             </div>
             <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/admin/users">
                    <Users className="w-4 h-4 mr-2" /> All Users Directory
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/admin/logs">
                    <ShieldCheck className="w-4 h-4 mr-2" /> Global Audit Logs
                  </Link>
                </Button>
             </div>
          </div>

          <div className="bg-primary/10 p-6 rounded-xl border border-primary/20 space-y-2">
            <h4 className="font-semibold text-primary">System Health</h4>
            <div className="flex items-center text-sm text-primary font-medium">
              <div className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
              All components operational
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
