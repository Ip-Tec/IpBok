"use client";
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { CreditCard, Save, Plus, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { BusinessType } from "@prisma/client";
import { useSession } from "next-auth/react";

export default function AdminPricingPage() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const businessTypes = Object.values(BusinessType);

  useEffect(() => {
    fetch("/api/admin/pricing")
      .then((res) => res.json())
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (type: string, price: string, days: string) => {
    setIsSaving(type);
    try {
      const response = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: type,
          monthlyPrice: price,
          trialDays: days,
        }),
      });

      if (!response.ok) throw new Error("Failed to save plan");

      const updatedPlan = await response.json();
      setPlans((prev) => {
        const index = prev.findIndex((p) => p.businessType === type);
        if (index >= 0) {
          const newPlans = [...prev];
          newPlans[index] = updatedPlan;
          return newPlans;
        }
        return [...prev, updatedPlan];
      });

      toast.success(`Pricing for ${type} updated successfully!`);
    } catch (error) {
      toast.error("Error saving pricing plan");
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" richColors />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-muted-foreground italic">
            Set subscription prices and trial periods for the platform.
          </p>
        </div>

        {loading ? (
          <div className="p-20 text-center text-muted-foreground animate-pulse">
            Loading Pricing Plans...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessTypes.map((type) => {
              const plan = plans.find((p) => p.businessType === type) || {
                businessType: type,
                monthlyPrice: 0,
                trialDays: 30,
              };

              return (
                <PricingCard
                  key={type}
                  plan={plan}
                  onSave={handleSave}
                  isSaving={isSaving === type}
                  isReadOnly={session?.user?.role === "SUPPORT"}
                />
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function PricingCard({
  plan,
  onSave,
  isSaving,
  isReadOnly,
}: {
  plan: any;
  onSave: any;
  isSaving: boolean;
  isReadOnly?: boolean;
}) {
  const [price, setPrice] = useState(plan.monthlyPrice.toString());
  const [days, setDays] = useState(plan.trialDays.toString());

  // Sync state when data is loaded/changed
  useEffect(() => {
    setPrice(plan.monthlyPrice.toString());
    setDays(plan.trialDays.toString());
  }, [plan]);

  return (
    <Card className="border-border bg-card hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <CardHeader className="bg-muted/50 border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">
            {plan.businessType}
          </CardTitle>
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
        <CardDescription>
          Configure pricing for {plan.businessType.toLowerCase()} businesses.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${plan.businessType}-price`}>
            Monthly Price (₦)
          </Label>
          {isReadOnly ? (
            <div className="p-2 bg-muted rounded-md text-foreground font-medium">
              ₦{parseFloat(price).toLocaleString()}
            </div>
          ) : (
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">
                ₦
              </span>
              <Input
                id={`${plan.businessType}-price`}
                type="number"
                className="pl-8"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${plan.businessType}-days`}>
            Trial Period (Days)
          </Label>
          {isReadOnly ? (
            <div className="p-2 bg-muted rounded-md text-foreground font-medium">
              {days} Days
            </div>
          ) : (
            <Input
              id={`${plan.businessType}-days`}
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="30"
            />
          )}
        </div>

        {!isReadOnly && (
          <Button
            className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            onClick={() => onSave(plan.businessType, price, days)}
            disabled={isSaving}
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <span className="flex items-center">
                <Save className="w-4 h-4 mr-2" /> Save Configuration
              </span>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
