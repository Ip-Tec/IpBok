
"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface CashConfirmationCardProps {
    cashAdvance: {
        id: string;
        amount: number;
        description: string | null;
        givenBy?: {
            name: string | null;
        } | null;
        recordedBy?: {
            name: string | null;
        } | null;
    };
    businessPhone: string | null;
    onConfirmation: () => void;
}

export function CashConfirmationCard({ cashAdvance, businessPhone, onConfirmation }: CashConfirmationCardProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/cash-advances/${cashAdvance.id}/confirm`, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to confirm cash advance');
            }

            toast.success('Cash advance confirmed successfully!');
            onConfirmation();
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('An unknown error occurred.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 p-4 rounded-md shadow-md mb-6">
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-bold">Pending Cash Confirmation</p>
                    <p>You have a pending cash advance of <span className="font-bold">₦{cashAdvance.amount.toFixed(2)}</span> from {(cashAdvance.givenBy || cashAdvance.recordedBy)?.name || 'the owner'}.</p>
                    {cashAdvance.description && <p className="text-sm dark:text-yellow-200">Description: {cashAdvance.description}</p>}
                </div>
                <Button onClick={handleConfirm} disabled={isSubmitting}>
                    {isSubmitting ? 'Confirming...' : 'Confirm Cash'}
                </Button>
            </div>
            <div className="mt-4 text-sm dark:text-yellow-200">
                <p>If the amount is incorrect, please contact the owner at <span className="font-semibold">{businessPhone || 'the provided number'}</span>.</p>
            </div>
        </div>
    );
}
