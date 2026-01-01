"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, ShoppingBag, Briefcase, User } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const businessTypes = [
    {
      id: "POS",
      title: "Point of Sale (POS)",
      description: "For agents, money transfer, and daily floating cash management.",
      icon: ShoppingBag,
    },
    {
      id: "RETAIL",
      title: "Retail Business",
      description: "For shops managing inventory, sales, and simple expenses.",
      icon: Building,
    },
    {
      id: "CORPORATE",
      title: "Corporate / Firm",
      description: "For service-based companies requiring accounting, invoices, and payroll.",
      icon: Briefcase,
    },
    /*
    {
      id: "PERSONAL",
      title: "Personal Finance",
      description: "Track your personal income, expenses, and budget.",
      icon: User,
    },
    */
  ];

  const handleSelectType = async (type: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/business/update-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        // Force session update to reflect changes
        await update();
        router.push("/dashboard");
        router.refresh();
      } else {
        console.error("Failed to update business type");
      }
    } catch (error) {
      console.error("Error updating business type:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to IpBok</h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            How would you like to use IpBok?
          </p>
          <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">
            Select the category that best describes your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {businessTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card 
                key={type.id} 
                className="cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
                onClick={() => !isLoading && handleSelectType(type.id)}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle>{type.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base dark:text-gray-400">
                    {type.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
