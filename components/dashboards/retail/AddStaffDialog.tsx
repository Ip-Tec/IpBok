"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, Check, X } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface AddStaffDialogProps {
  onStaffAdded: () => void;
}

export function AddStaffDialog({ onStaffAdded }: AddStaffDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("CASHIER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/retail/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to add staff");
      }

      const data = await response.json();
      toast.success(data.message || "Invitation sent successfully!");
      onStaffAdded();
      setIsOpen(false);
      setEmail("");
      setRole("CASHIER");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" /> Add Staff Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Retail Staff</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASHIER">Retail Cashier</SelectItem>
                <SelectItem value="MANAGER">Retail Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg border border-border mt-4">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-2">
               Permissions Preview: {role === "CASHIER" ? "Cashier" : "Manager"}
            </h4>
            <ul className="text-xs space-y-1 text-foreground">
              {role === "CASHIER" ? (
                <>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Record retail sales</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> View inventory (no cost/profit)</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> View own sales history</li>
                  <li className="flex items-center gap-2"><X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /> Delete records</li>
                  <li className="flex items-center gap-2"><X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /> Access reports/settings</li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Manage products & categories</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> View all sales & reports</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Record sales & reconcile stock</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Access full inventory details</li>
                  <li className="flex items-center gap-2"><X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /> Manage business settings</li>
                </>
              )}
            </ul>
          </div>
          
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSubmitting ? "Adding Staff..." : "Add Staff Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
