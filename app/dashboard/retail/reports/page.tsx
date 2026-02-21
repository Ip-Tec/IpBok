"use client";
import React, { useState } from "react";
import { TrendingUp, FileText, Download, Calendar, Filter, PieChart, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("daily");

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Business Reports
          </h1>
          <p className="text-muted-foreground text-sm">Detailed insights into your sales and profit performance.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" /> Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Sales Reconciliation Report</CardTitle>
              <CardDescription>Comparison of stock movement vs actual sales.</CardDescription>
            </div>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-xl border-2 border-dashed border-muted mt-4">
               <div className="text-center">
                  <BarChart className="w-12 h-12 text-muted mx-auto mb-2" />
                  <p className="text-muted-foreground italic">Extended reporting visualizations will appear here based on your {reportType} data.</p>
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">₦0.00</div>
              <p className="text-xs text-muted-foreground">+0% from last period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">₦0.00</div>
              <p className="text-xs text-muted-foreground">+0% from last period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Inventory Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">100%</div>
              <p className="text-xs text-muted-foreground text-green-500">In Stock</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Reconciliation Log</CardTitle>
        </CardHeader>
        <CardContent>
           <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Opening Stock Value</th>
                  <th className="px-4 py-3">Sales Recorded</th>
                  <th className="px-4 py-3">Closing Stock Value</th>
                  <th className="px-4 py-3 text-right">Profit</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border italic text-muted-foreground">
                <tr>
                  <td colSpan={6} className="text-center py-10">Detailed daily reconciliation logs will be generated automatically as you record sales.</td>
                </tr>
              </tbody>
           </table>
        </CardContent>
      </Card>
    </div>
  );
}
