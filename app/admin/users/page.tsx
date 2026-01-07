"use client";
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Trash2, Edit, Mail, Search, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SendUserEmailDialog } from "@/components/admin/SendUserEmailDialog";
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
import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const roles = Object.values(Role);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        if (res.status === 401)
          throw new Error("Unauthorized: Please re-login as Admin.");
        throw new Error(`Failed to fetch users: ${res.statusText}`);
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingUser.name,
          role: editingUser.role,
          emailVerified: editingUser.verified,
        }),
      });

      if (!response.ok) throw new Error("Update failed");

      const updated = await response.json();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === updated.id
            ? {
                ...u,
                role: updated.role,
                name: updated.name,
                verified: !!updated.emailVerified,
              }
            : u,
        ),
      );
      toast.success("User updated successfully!");
      setEditingUser(null);
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This cannot be undone.",
      )
    )
      return;

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Delete failed");
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User deleted successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" richColors />
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">User Directory</h1>
            <p className="text-muted-foreground italic">
              Platform-wide user management and oversight.
            </p>
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
            <div className="p-20 text-center text-muted-foreground animate-pulse">
              Loading User Directory...
            </div>
          ) : error ? (
            <div className="p-20 text-center space-y-4">
              <div className="text-destructive font-medium">{error}</div>
              <Button onClick={() => fetchUsers()} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-muted text-muted-foreground text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">
                    Name & Email
                  </th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">
                    Global Role
                  </th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">
                    Business(es)
                  </th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-foreground">
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        <Mail className="w-3 h-3 mr-1" /> {u.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                          u.role === "SUPERADMIN"
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-secondary text-secondary-foreground border-border",
                        )}
                      >
                        {u.role}
                      </span>
                      {u.role === "SUPERADMIN" && (
                        <ShieldAlert className="w-3 h-3 ml-1 text-primary inline" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.businesses && u.businesses.length > 0 ? (
                          u.businesses.map((b: string, i: number) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 bg-muted rounded border border-border"
                            >
                              {b}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            None
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {u.transactionCount || 0} txs
                    </td>
                    <td className="px-6 py-4">
                      {u.verified ? (
                        <span className="text-xs text-green-500 font-medium">
                          Verified
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-600 font-medium">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <SendUserEmailDialog
                        userEmail={u.email}
                        userName={u.name || u.email}
                      />

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingUser({ ...u })}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      {session?.user?.id !== u.id &&
                        session?.user?.role === "SUPERADMIN" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(u.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        {editingUser && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser.email}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={editingUser.name || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Global Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(v) =>
                    setEditingUser({ ...editingUser, role: v })
                  }
                  disabled={session?.user?.role === "SUPPORT"}
                >
                  <SelectTrigger
                    className={cn(
                      session?.user?.role === "SUPPORT" &&
                        "bg-muted cursor-not-allowed",
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {session?.user?.role === "SUPPORT" && (
                  <p className="text-[10px] text-muted-foreground italic mt-1">
                    Support agents cannot modify global roles.
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="verified"
                  checked={editingUser.verified}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      verified: e.target.checked,
                    })
                  }
                  className="rounded border-border"
                />
                <Label htmlFor="verified">Email Verified</Label>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
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
