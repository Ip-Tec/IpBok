"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentMethod } from "@/src/generated";

interface RecordTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "Income" | "Expense" | "Deposit" | "Withdrawal";
  initialData?: {
    id: string;
    amount: number;
    description: string | null;
    category?: string | null;
    paymentMethod: string;
  } | null;
  onSuccess: () => void;
}

export function RecordTransactionDialog({
  open,
  onOpenChange,
  type,
  initialData,
  onSuccess,
}: RecordTransactionDialogProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH,
  );
  const [isSubmitting, setIsSubmitting] = useState(false); // Declare setIsSubmitting here

  // Map DB types (Deposit/Withdrawal) to UI types (Income/Expense) if needed
  const displayType =
    type === "Deposit" ? "Income" : type === "Withdrawal" ? "Expense" : type;

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setDescription(initialData.description || "");
      setCategory(initialData.category || "Uncategorized");
      // Ensure payment method is a valid enum value, fallback to CASH
      setPaymentMethod(
        (initialData.paymentMethod as PaymentMethod) || PaymentMethod.CASH,
      );
    } else {
      // Reset form on open if no initial data (Create mode)
      if (open) {
        setAmount("");
        setDescription("");
        setCategory("Uncategorized");
        setPaymentMethod(PaymentMethod.CASH);
      }
    }
  }, [initialData, open]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const url = isEditing
        ? "/api/transactions"
        : "/api/dashboard/accounting/transaction";

      const method = isEditing ? "PATCH" : "POST";
      const endpoint = "/api/transactions"; // Using unified endpoint for newer logic if possible, but let's stick to what worked or was intended.

      // Actually, I previously decided to use /api/transactions for both if simplified.
      // But to be safe and match the `endpoint` variable usage below:

      const body: any = {
        amount: parseFloat(amount),
        description,
        category,
        paymentMethod,
      };

      if (isEditing) {
        body.id = initialData?.id;
      } else {
        body.type = type; // Only needed for creation
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to record transaction");
      }

      toast.success(
        `${displayType} ${isEditing ? "updated" : "recorded"} successfully!`,
      );
      onSuccess();
      onOpenChange(false);
      if (!isEditing) {
        setAmount("");
        setDescription("");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit" : "Record"} {displayType}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentMethod" className="text-right">
              Method
            </Label>
            <Select
              onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
              value={paymentMethod}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                <SelectItem value={PaymentMethod.BANK}>Bank</SelectItem>
                <SelectItem value={PaymentMethod.BANK_TRANSFER}>
                  Bank Transfer
                </SelectItem>
                <SelectItem value={PaymentMethod.MOBILE_MONEY}>
                  Mobile Money
                </SelectItem>
                <SelectItem value={PaymentMethod.ATM_CARD}>ATM Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Food">Food & Dining</SelectItem>
                <SelectItem value="Transport">Transportation</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Rent">Rent</SelectItem>
                <SelectItem value="Shopping">Shopping</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Salary">Salary</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting || !amount}>
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Update Transaction"
                : "Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
