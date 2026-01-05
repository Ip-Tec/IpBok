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
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Role } from "@/src/generated";

interface AddMemberDialogProps {
  onMemberAdded: () => void;
}

export function AddMemberDialog({ onMemberAdded }: AddMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>(Role.AGENT); // Default to Agent
  const [initialCash, setInitialCash] = useState("");
  const [initialBank, setInitialBank] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!session?.user?.businessId) {
      toast.error("You are not associated with a business.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          businessId: session.user.businessId,
          initialCash: role === Role.AGENT ? (initialCash ? parseFloat(initialCash) : 0) : undefined,
          initialBank: role === Role.AGENT ? (initialBank ? parseFloat(initialBank) : 0) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create member");
      }

      toast.success("Member created successfully!");
      onMemberAdded();
      setIsOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole(Role.AGENT);
      setInitialCash("");
      setInitialBank("");
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" /> Add Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Jana Johnson"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                placeholder="example@email.com"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                placeholder="000000"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <div className="col-span-3">
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Role.AGENT}>Agent</SelectItem>
                      {/* Hide other roles for now as per user request */}
                      {/* <SelectItem value={Role.MANAGER}>Manager</SelectItem>
                      <SelectItem value={Role.ACCOUNTANT}>Accountant</SelectItem>
                      <SelectItem value={Role.AUDITOR}>Auditor</SelectItem>
                      <SelectItem value={Role.FINANCE_OFFICER}>Finance Officer</SelectItem> */}
                    </SelectContent>
                  </Select>
              </div>
            </div>
            
            {role === Role.AGENT && (
                <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium mb-3">Initial Funds Assignment</h4>
                    <div className="grid gap-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="initialCash" className="text-right">
                            Cash Float
                        </Label>
                        <Input
                            id="initialCash"
                            type="number"
                            value={initialCash}
                            onChange={(e) => setInitialCash(e.target.value)}
                            className="col-span-3"
                            placeholder="0.00"
                            min="0"
                        />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="initialBank" className="text-right">
                            Bank Float
                        </Label>
                        <Input
                            id="initialBank"
                            type="number"
                            value={initialBank}
                            onChange={(e) => setInitialBank(e.target.value)}
                            className="col-span-3"
                            placeholder="0.00"
                            min="0"
                        />
                        </div>
                    </div>
                </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
