"use client";
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Building2,
  Search,
  Calendar,
  CreditCard,
  ChevronRight,
  Edit3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast, Toaster } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingBusiness, setEditingBusiness] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bizRes, planRes] = await Promise.all([
        fetch("/api/admin/businesses"),
        fetch("/api/admin/pricing"),
      ]);

      if (!bizRes.ok || !planRes.ok) {
        throw new Error("Failed to authenticate or fetch admin data");
      }

      const [bizData, planData] = await Promise.all([
        bizRes.json(),
        planRes.json(),
      ]);

      setBusinesses(Array.isArray(bizData) ? bizData : []);
      setPlans(Array.isArray(planData) ? planData : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const response = await fetch(
        `/api/admin/businesses/${editingBusiness.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionStatus: editingBusiness.subscriptionStatus,
            trialEndsAt: editingBusiness.trialEndsAt,
            planId: editingBusiness.planId,
          }),
        },
      );

      if (!response.ok) throw new Error("Update failed");

      const updated = await response.json();
      setBusinesses((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)),
      );
      toast.success("Business updated successfully!");
      setEditingBusiness(null);
    } catch (error) {
      toast.error("Failed to update business");
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = businesses.filter(
    (b) =>
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.id?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayout>
      <Toaster position="top-right" richColors />
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Business Oversight</h1>
            <p className="text-muted-foreground italic">
              Global management of all registered businesses and subscriptions.
            </p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search business name..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-muted-foreground animate-pulse">
              Gathering Business Data...
            </div>
          ) : error ? (
            <div className="p-20 text-center space-y-4">
              <div className="text-destructive font-medium">{error}</div>
              <Button onClick={() => fetchAll()} variant="outline" size="sm">
                Refresh View
              </Button>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-muted text-muted-foreground text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Business Name</th>
                  <th className="px-6 py-4 font-medium">Type & Plan</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Metrics</th>
                  <th className="px-6 py-4 font-medium">Renewal/Trial</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">
                        {b.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">
                        {b.id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">
                        {b.type || "Undefined"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {b.planName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          b.subscriptionStatus === "ACTIVE"
                            ? "bg-green-500/10 text-green-500"
                            : b.subscriptionStatus === "TRIAL"
                              ? "bg-primary/10 text-primary"
                              : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {b.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        {b.memberCount || 0} members
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {b.transactionCount || 0} txs
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {b.subscriptionStatus === "TRIAL" && b.trialEndsAt
                          ? format(new Date(b.trialEndsAt), "MMM d, yyyy")
                          : b.subscriptionEndsAt
                            ? format(
                                new Date(b.subscriptionEndsAt),
                                "MMM d, yyyy",
                              )
                            : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingBusiness({ ...b })}
                      >
                        <Edit3 className="w-4 h-4 mr-1" /> Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Management Dialog */}
      <Dialog
        open={!!editingBusiness}
        onOpenChange={(open) => !open && setEditingBusiness(null)}
      >
        {editingBusiness && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Management: {editingBusiness.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Subscription Status</Label>
                <Select
                  value={editingBusiness.subscriptionStatus}
                  onValueChange={(v) =>
                    setEditingBusiness({
                      ...editingBusiness,
                      subscriptionStatus: v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRIAL">TRIAL</SelectItem>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                    <SelectItem value="PAUSED">PAUSED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pricing Plan Override</Label>
                <Select
                  value={editingBusiness.planId || "none"}
                  onValueChange={(v) =>
                    setEditingBusiness({
                      ...editingBusiness,
                      planId: v === "none" ? null : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Plan</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.businessType} (₦{p.monthlyPrice})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trial End Date</Label>
                <Input
                  type="date"
                  value={
                    editingBusiness.trialEndsAt
                      ? format(
                          new Date(editingBusiness.trialEndsAt),
                          "yyyy-MM-dd",
                        )
                      : ""
                  }
                  onChange={(e) =>
                    setEditingBusiness({
                      ...editingBusiness,
                      trialEndsAt: e.target.value,
                    })
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingBusiness(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </AdminLayout>
  );
}
