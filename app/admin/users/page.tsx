"use client";
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Users, Search, Mail, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then(res => res.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">User Directory</h1>
            <p className="text-muted-foreground italic">Platform-wide user management and oversight.</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-10" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-muted-foreground animate-pulse">Loading User Directory...</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-muted text-muted-foreground text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Name & Email</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Global Role</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Business(es)</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-foreground">
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        <Mail className="w-3 h-3 mr-1" /> {u.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                        u.role === "SUPERADMIN" ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary text-secondary-foreground border-border"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-wrap gap-1">
                          {u.businesses.length > 0 ? u.businesses.map((b: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-muted rounded border border-border">
                              {b}
                            </span>
                          )) : <span className="text-xs text-muted-foreground italic">None</span>}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {u.transactionCount} txs
                    </td>
                    <td className="px-6 py-4">
                      {u.verified ? (
                         <span className="text-xs text-green-500 font-medium">Verified</span>
                      ) : (
                         <span className="text-xs text-yellow-600 font-medium">Unverified</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
