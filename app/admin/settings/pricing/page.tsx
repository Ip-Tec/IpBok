"use client";
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { CreditCard, Save, Calendar, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/pricing")
      .then(res => res.json())
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (plan: any) => {
    setSaving(plan.id);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: plan.id,
          monthlyPrice: plan.monthlyPrice,
          trialDays: plan.trialDays
        })
      });

      if (res.ok) {
        toast.success(`${plan.businessType} pricing updated successfully`);
      } else {
        toast.error("Failed to update pricing");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(null);
    }
  };

  const handleChange = (id: string, field: string, value: string) => {
    setPlans(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Pricing & Trials</h1>
          <p className="text-muted-foreground mt-2">Regulate monthly subscription rates and free trial durations for all business packages.</p>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="p-20 text-center text-muted-foreground animate-pulse">Loading Pricing Configuration...</div>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="bg-card rounded-xl border border-border p-6 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold uppercase tracking-wider">{plan.businessType} Plan</h3>
                      <p className="text-sm text-muted-foreground">Set global rules for this package.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-md">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground flex items-center">
                        Monthly Price (₦)
                      </label>
                      <Input 
                        type="number" 
                        value={plan.monthlyPrice} 
                        onChange={(e) => handleChange(plan.id, "monthlyPrice", e.target.value)}
                        className="font-mono font-bold text-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground flex items-center">
                        Free Trial (Days)
                      </label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          value={plan.trialDays} 
                          onChange={(e) => handleChange(plan.id, "trialDays", e.target.value)}
                          className="pl-9 font-mono font-bold text-lg"
                        />
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleUpdate(plan)} 
                    disabled={saving === plan.id}
                    className="md:w-32"
                  >
                    {saving === plan.id ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save</>}
                  </Button>
                </div>

                {plan.businessType === "PERSONAL" && (
                  <div className="mt-4 flex items-center text-xs text-primary/80 bg-primary/5 p-2 rounded border border-primary/10">
                    <Info className="w-4 h-4 mr-2" />
                    Recommended: Keep Personal free by setting price to 0 and trial to 999 days.
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="bg-muted/50 p-6 rounded-xl border border-border space-y-4">
          <h4 className="font-semibold flex items-center">
            <Info className="w-5 h-5 mr-2 text-primary" /> Monetization Strategy Tips
          </h4>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li><strong>POS Businesses</strong> usually expect longer trials (60 days) to get comfortable with the float system.</li>
            <li><strong>Corporate Plans</strong> should have higher prices as they handle larger teams and more transactions.</li>
            <li><strong>Personal Packages</strong> act as a "Freemium" hook to bring users into the ecosystem.</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
