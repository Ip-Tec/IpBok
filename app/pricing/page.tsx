import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await prisma.pricingPlan.findMany({
    select: {
      id: true,
      businessType: true,
      monthlyPrice: true,
      trialDays: true,
    },
    orderBy: {
      monthlyPrice: 'asc'
    }
  });

  const getFeatures = (type: string) => {
    switch (type) {
      case "PERSONAL":
        return ["Individual tracking", "Income & Expenses", "Basic Reports", "Mobile App Access"];
      case "POS":
      case "SME":
        return ["Waiters & Staff Management", "Daily Sales Reports", "Inventory Tracking", "60 Days Free Trial"];
      case "RETAIL":
        return ["Multiple Cash Points", "Inventory Management", "Sales Tracking", "Audit Logs"];
      case "CORPORATE":
        return ["Multi-branch Support", "Advanced Financial Reports", "Audit & Compliance Tools", "Dedicated Support"];
      default:
        return ["Basic Accounting", "Cloud Sync"];
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-1.5 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Simple Transparent Pricing</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Choose the Right Plan for Your Business</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Whether you're an individual or a growing enterprise, we have a plan that fits your needs. Start your free trial today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const features = getFeatures(plan.businessType);
            const isMostPopular = plan.businessType === "CORPORATE";

            return (
              <div 
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md",
                  isMostPopular ? "border-primary shadow-md ring-1 ring-primary/20 scale-105 z-10" : "border-border"
                )}
              >
                {isMostPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    {plan.businessType}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">₦{plan.monthlyPrice.toLocaleString()}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-primary font-medium">
                    {plan.trialDays} Days Free Trial
                  </p>
                </div>

                <div className="flex-grow mb-8">
                  <ul className="space-y-4">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href="/signup" className="w-full">
                  <Button 
                    variant={isMostPopular ? "default" : "outline"} 
                    className="w-full py-6 text-lg font-semibold"
                  >
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-20 text-center p-12 rounded-3xl bg-primary/5 border border-primary/10 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Not sure which one to pick?</h2>
          <p className="text-muted-foreground mb-8">
            Our support team is here to help you choose the best plan for your operational needs. Get in touch for a custom consultation.
          </p>
          <Button variant="outline" size="lg">Contact Support</Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
