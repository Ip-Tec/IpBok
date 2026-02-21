"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Search, UserCog, Mail, Shield, UserMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddStaffDialog } from "@/components/dashboards/retail/AddStaffDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface StaffMember {
  id: string; // user id or token
  name: string | null;
  email: string;
  role: string;
  status: string; // 'Active', 'Pending', 'Expired'
  isInvite?: boolean;
  expiresAt?: string;
}

export default function RetailStaffPage() {
  const { data: session } = useSession();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; member: StaffMember | null; isDeleting: boolean }>({ isOpen: false, member: null, isDeleting: false });
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/retail/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      const data = await res.json();
      setStaff(data);
    } catch (error) {
      console.error(error);
      toast.error("Error loading staff members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchStaff();
  }, [session]);

  const handleDeleteClick = (member: StaffMember) => {
    setDeleteDialog({ isOpen: true, member, isDeleting: false });
  };

  const confirmDelete = async () => {
    const member = deleteDialog.member;
    if (!member) return;
    
    setDeleteDialog(prev => ({ ...prev, isDeleting: true }));
    
    try {
      if (member.isInvite) {
        // We reuse a retail specific endpoint for revoking invites (or create it)
        // For now, let's call the DELETE method on the staff API.
        const res = await fetch(`/api/retail/staff?token=${member.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to cancel invitation");
        toast.success("Invitation cancelled");
      } else {
        const res = await fetch(`/api/agents/${member.id}`, { method: "DELETE" }); // Reuse agent delete API
        if (!res.ok) throw new Error("Failed to delete staff member");
        toast.success("Staff member removed successfully");
      }
      fetchStaff();
    } catch (error) {
      toast.error(member.isInvite ? "Error cancelling invitation" : "Error deleting staff member");
    } finally {
      setDeleteDialog({ isOpen: false, member: null, isDeleting: false });
    }
  };

  const handleResend = async (member: StaffMember) => {
    setResendingId(member.id);
    try {
      const res = await fetch("/api/retail/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: member.email, role: member.role }),
      });
      if (!res.ok) throw new Error("Failed to resend invitation");
      toast.success("Invitation resent successfully");
      fetchStaff();
    } catch (error) {
      toast.error("Error resending invitation");
    } finally {
      setResendingId(null);
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground mt-1">Manage your retail managers and cashiers</p>
        </div>
        <AddStaffDialog onStaffAdded={fetchStaff} />
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search staff..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))
        ) : filteredStaff.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No staff members found matching your search.
          </div>
        ) : (
          filteredStaff.map((member) => (
            <Card key={member.id} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              <div className={cn(
                "absolute top-0 right-0 p-2 rounded-bl-xl text-[10px] font-bold uppercase",
                member.role === "MANAGER" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              )}>
                {member.role}
              </div>
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className={`text-lg ${member.isInvite ? 'text-muted-foreground italic' : ''}`}>
                      {member.name || "Unnamed Staff"}
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Mail className="w-3 h-3 mr-1" /> {member.email}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-primary/70" />
                    <span>{member.role === "MANAGER" ? "Mid-level Control" : "Limited Access"}</span>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    member.status === 'Active' ? 'bg-green-100 text-green-700' :
                    member.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  )}>
                    {member.status}
                  </span>
                </div>
                {member.status === "Pending" && member.expiresAt && (
                  <div className="text-[10px] text-muted-foreground text-right italic">
                     Expires: {new Date(member.expiresAt).toLocaleTimeString(undefined, {
                       hour: 'numeric',
                       minute: '2-digit',
                       hour12: true,
                       month: 'short',
                       day: 'numeric'
                     })}
                  </div>
                )}
                <div className="pt-2 flex gap-2">
                  {member.isInvite ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-primary hover:text-primary hover:bg-primary/5"
                      onClick={() => handleResend(member)}
                      disabled={resendingId === member.id}
                    >
                      {resendingId === member.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      Resend
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="flex-1" disabled>
                      <UserCog className="w-4 h-4 mr-2" /> Permissions
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-[110px]"
                    onClick={() => handleDeleteClick(member)}
                  >
                    <UserMinus className="w-4 h-4 mr-2" /> {member.isInvite ? "Cancel" : "Remove"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && !deleteDialog.isDeleting && setDeleteDialog({ isOpen: false, member: null, isDeleting: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to {deleteDialog.member?.isInvite ? "cancel this invitation" : "remove this staff member"}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={deleteDialog.isDeleting} onClick={() => setDeleteDialog({ isOpen: false, member: null, isDeleting: false })}>Cancel</Button>
            <Button variant="destructive" disabled={deleteDialog.isDeleting} onClick={confirmDelete}>
              {deleteDialog.isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
