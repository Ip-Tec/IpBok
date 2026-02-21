import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, startOfWeek, startOfMonth, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const businessId = session.user.businessId;

  try {
    // 1. KPI Calculations & Role Restrictions
    const isCashier = session.user.role === "CASHIER";

    const sales = await prisma.retailSale.findMany({
      where: { 
        businessId,
        ...(isCashier ? { recordedById: session.user.id } : {})
      },
      include: { product: true },
    });

    const products = await prisma.retailProduct.findMany({
      where: { businessId },
    });

    const totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    
    // Restricted fields
    const totalProfit = isCashier ? 0 : sales.reduce((acc, s) => acc + s.profit, 0);
    const inventoryValue = isCashier ? 0 : products.reduce((acc, p) => acc + (p.costPrice * p.stockQuantity), 0);
    
    const potentialProfit = isCashier ? 0 : products.reduce((acc, p) => {
      const sellPrice = p.sellingPrice || p.minPrice || 0;
      return acc + ((sellPrice - p.costPrice) * p.stockQuantity);
    }, 0);

    const lowStockCount = products.filter(p => p.stockQuantity < 5).length;

    // 2. Weekly Sales Chart Data
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weeklySales = await prisma.retailSale.findMany({
      where: {
        businessId,
        date: { gte: weekStart },
        ...(isCashier ? { recordedById: session.user.id } : {})
      },
    });

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyData = days.map((day, idx) => {
      const daySales = weeklySales.filter(s => new Date(s.date).getDay() === idx);
      return daySales.reduce((acc, s) => acc + s.totalAmount, 0);
    });

    // 3. Profit by Category (Doughnut) - Hide for Cashiers
    let categoryProfit: any[] = [];
    if (!isCashier) {
      const categories = await prisma.retailCategory.findMany({
        where: { businessId },
        include: { products: { include: { sales: true } } },
      });

      categoryProfit = categories.map(cat => ({
        name: cat.name,
        profit: cat.products.reduce((acc, p) => acc + p.sales.reduce((a, s) => a + s.profit, 0), 0),
      })).filter(c => c.profit > 0);
    }

    // 4. Recent Sales & Low Stock
    const recentSales = await prisma.retailSale.findMany({
      where: { 
        businessId,
        ...(isCashier ? { recordedById: session.user.id } : {})
      },
      include: { product: true },
      take: 5,
      orderBy: { date: "desc" },
    });

    const lowStockProducts = products
      .filter(p => p.stockQuantity < 5)
      .slice(0, 5)
      .map(p => ({ name: p.name, qty: p.stockQuantity }));

    return NextResponse.json({
      kpis: {
        totalSales,
        totalProfit: isCashier ? null : totalProfit,
        inventoryValue: isCashier ? null : inventoryValue,
        potentialProfit: isCashier ? null : potentialProfit,
        lowStockCount,
      },
      salesCharts: {
        labels: days,
        datasets: [{
          label: isCashier ? "My Sales" : "Sales",
          data: dailyData,
          backgroundColor: "rgba(59, 130, 246, 0.5)",
        }]
      },
      profitCharts: isCashier ? null : {
        labels: categoryProfit.map(c => c.name),
        datasets: [{
          data: categoryProfit.map(c => c.profit),
          backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
        }]
      },
      recentSales: recentSales.map(s => ({
        id: s.id,
        product: s.product.name,
        qty: s.quantity,
        total: s.totalAmount,
        profit: isCashier ? null : s.profit,
        date: s.date.toISOString().split("T")[0],
      })),
      lowStockProducts,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
