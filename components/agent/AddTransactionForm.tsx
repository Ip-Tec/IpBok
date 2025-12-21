"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui button
import { Input } from "@/components/ui/input"; // Assuming shadcn/ui input
import { Label } from "@/components/ui/label"; // Assuming shadcn/ui label
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Assuming shadcn/ui radio group
import { Textarea } from "@/components/ui/textarea"; // Assuming shadcn/ui textarea
import { Transaction } from "@/lib/types";

interface AddTransactionFormProps {
  // This type represents the data needed to create a new transaction,
  // excluding properties that are automatically generated or determined by the system.
  onAddTransaction: (
    mainTransaction: Omit<
      Transaction,
      "id" | "businessId" | "userId" | "date" | "status" | "type"
    > & { type: "Deposit" | "Withdrawal" | "Charge" },
    chargeTransaction?: Omit<
      Transaction,
      "id" | "businessId" | "userId" | "date" | "status" | "type"
    > & { type: "Deposit" | "Withdrawal" | "Charge" }
  ) => void;
  transactionType: "Deposit" | "Withdrawal" | "Charge";
}

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({
  onAddTransaction,
  transactionType,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank">("cash");
  const [notes, setNotes] = useState<string>("");
  const [chargeAmount, setChargeAmount] = useState<string>(""); // New state for charge

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      alert("Please enter an amount.");
      return;
    }

    const mainTransaction = {
      type: transactionType,
      amount: parseFloat(amount),
      paymentMethod,
      description: notes,
    };

    let secondaryChargeTransaction:
      | (Omit<
          Transaction,
          "id" | "businessId" | "userId" | "date" | "status" | "type"
        > & { type: "Deposit" | "Withdrawal" | "Charge" })
      | undefined;

    if (
      (transactionType === "Deposit" || transactionType === "Withdrawal") &&
      chargeAmount &&
      parseFloat(chargeAmount) > 0
    ) {
      secondaryChargeTransaction = {
        type: "Charge",
        amount: parseFloat(chargeAmount),
        paymentMethod, // Assuming charge uses the same payment method
        description: `Charge for ${transactionType}: ${notes}`,
      };
    }

    onAddTransaction(mainTransaction, secondaryChargeTransaction);

    // Clear form
    setAmount("");
    setNotes("");
    setPaymentMethod("cash");
    setChargeAmount(""); // Clear charge amount as well
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h3 className="text-xl font-semibold">Add {transactionType}</h3>
      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>
      {(transactionType === "Deposit" || transactionType === "Withdrawal") && (
        <div>
          <Label htmlFor="chargeAmount">Charge Amount (optional)</Label>
          <Input
            id="chargeAmount"
            type="number"
            value={chargeAmount}
            onChange={(e) => setChargeAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
      )}
      <div>
        <Label>Payment Method</Label>
        <RadioGroup
          defaultValue="cash"
          value={paymentMethod}
          onValueChange={(value: "cash" | "bank") => setPaymentMethod(value)}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cash" id="cash" />
            <Label htmlFor="cash">Cash</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="bank" id="bank" />
            <Label htmlFor="bank">Bank</Label>
          </div>
        </RadioGroup>
      </div>
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes"
        />
      </div>
      <Button type="submit">Add {transactionType}</Button>
    </form>
  );
};

export default AddTransactionForm;
