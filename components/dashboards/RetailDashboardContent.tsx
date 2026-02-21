"use client";
import { User } from "@/lib/types";
import { useState, useEffect } from "react";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import KpiCard from "./KpiCard";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const RetailDashboardContent = (user: User) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/retail/dashboard");
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-2xl font-semibold text-foreground animate-pulse">
          Loading Retail Dashboard...
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Retail Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, {user.name}. Here's how your shop is performing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KpiCard
          title="Total Sales"
          value={`₦${dashboardData.kpis.totalSales.toLocaleString()}`}
          description="Total revenue generated"
          icon={ShoppingCart}
        />
        <KpiCard
          title="Total Profit"
          value={`₦${dashboardData.kpis.totalProfit.toLocaleString()}`}
          description="Net earnings after costs"
          icon={TrendingUp}
          valueClassName="text-green-600"
        />
        <KpiCard
          title="Inventory Value"
          value={`₦${dashboardData.kpis.inventoryValue.toLocaleString()}`}
          description="Total cost of stock on hand"
          icon={Package}
        />
        <KpiCard
          title="Potential Profit"
          value={`₦${dashboardData.kpis.potentialProfit.toLocaleString()}`}
          description="Expected profit from current stock"
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 bg-card rounded-lg shadow border border-border">
            <h3 className="text-lg font-semibold mb-6 flex items-center justify-between">
              Weekly Sales Performance
            </h3>
            <div className="h-80">
              <Bar
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => `₦${Number(value) / 1000}k`
                      }
                    }
                  }
                }}
                data={dashboardData.salesCharts}
              />
            </div>
          </div>

          <div className="p-6 bg-card rounded-lg shadow border border-border">
            <h3 className="text-lg font-semibold mb-6">Recent Sales</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Profit</th>
                    <th className="px-4 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dashboardData.recentSales.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{sale.product}</td>
                      <td className="px-4 py-3 text-center">{sale.qty}</td>
                      <td className="px-4 py-3 text-right font-semibold">₦{sale.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-green-600">₦{sale.profit.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{sale.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="p-6 bg-card rounded-lg shadow border border-border">
            <h3 className="text-lg font-semibold mb-6">Profit by Category</h3>
            <div className="h-64">
              <Doughnut
                data={dashboardData.profitCharts}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom" } },
                }}
              />
            </div>
          </div>

          <div className="p-6 bg-card rounded-lg shadow border border-border">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
              Low Stock Alerts
            </h3>
            <div className="space-y-4">
              {dashboardData.lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">All stock levels are healthy.</p>
              ) : (
                dashboardData.lowStockProducts.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900/50">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Only {p.qty} left in stock</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-6 bg-card rounded-lg shadow border-2 border-primary/20 bg-primary/5">
            <h3 className="text-lg font-semibold mb-2">Performance Tip</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your "Accessories" category has the highest profit margin (25%). Consider restocking more items in this category to maximize overall profit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetailDashboardContent;
