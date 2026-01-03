"use client";
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Building2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/businesses")
      .then(res => res.json())
      .then(setBusinesses)
      .finally(() => setLoading(false));
  }, []);

  const filtered = businesses.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Manage Businesses</h1>
            <p className="text-muted-foreground italic">Global directory of all organizations on the platform.</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or ID..." 
                className="pl-10" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">Loading Businesses...</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-muted text-muted-foreground text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Business Name</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Members</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Transactions</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{b.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{b.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-bold uppercase">
                        {b.type || "UNSET"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{b.memberCount} members</td>
                    <td className="px-6 py-4">{b.transactionCount} txs</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                       <Button variant="outline" size="sm" asChild>
                         <Link href={`/admin/businesses/${b.id}`}>Manage</Link>
                       </Button>
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
