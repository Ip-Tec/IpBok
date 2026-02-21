"use client";
import React, { useState, useEffect } from "react";
import { ShoppingCart, Plus, Search, Filter, Calendar, TrendingUp, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function SalesPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role?.toUpperCase();
  const isCashier = userRole === "CASHIER";

  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  
  // Sale Form State
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "1",
    price: "",
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [salesRes, prodRes] = await Promise.all([
        fetch("/api/retail/sales"),
        fetch("/api/retail/products")
      ]);
      
      if (salesRes.ok) setSales(await salesRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductChange = (id: string) => {
    const product = products.find(p => p.id === id);
    setSelectedProduct(product);
    setFormData({
      ...formData,
      productId: id,
      price: product?.sellingPrice || product?.minPrice || "",
    });
  };

  const handleRecordSale = async () => {
    if (!formData.productId || !formData.quantity || !formData.price) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("/api/retail/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Sale recorded successfully");
        setIsSaleModalOpen(false);
        setFormData({ productId: "", quantity: "1", price: "" });
        setSelectedProduct(null);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to record sale");
      }
    } catch (error) {
      toast.error("Error recording sale");
    }
  };

  const totalSalesAmount = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  const totalProfitAmount = sales.reduce((acc, sale) => acc + sale.profit, 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Sales Tracking
          </h1>
          <p className="text-muted-foreground text-sm">Monitor your daily sales and profit margins.</p>
        </div>
        
        <Dialog open={isSaleModalOpen} onOpenChange={setIsSaleModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" /> Record New Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Retail Sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Product</Label>
                <Select value={formData.productId} onValueChange={handleProductChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Search product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.stockQuantity} in stock)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      max={selectedProduct.stockQuantity}
                      value={formData.quantity} 
                      onChange={e => setFormData({...formData, quantity: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price (₦)</Label>
                    <Input 
                      type="number" 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                    />
                  </div>
                </div>
              )}

              {selectedProduct && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Subtotal:</span>
                    <span className="font-bold">₦{(parseFloat(formData.price || "0") * parseFloat(formData.quantity || "0")).toLocaleString()}</span>
                  </div>
                  {!isCashier && (
                    <div className="flex justify-between text-green-600">
                      <span>Est. Profit:</span>
                      <span className="font-bold">₦{((parseFloat(formData.price || "0") - selectedProduct.costPrice) * parseFloat(formData.quantity || "0")).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSaleModalOpen(false)}>Cancel</Button>
              <Button onClick={handleRecordSale}>Confirm Sale</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₦{totalSalesAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        {!isCashier && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Total Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₦{totalProfitAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  {!isCashier && <th className="px-4 py-3 text-right">Profit</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="h-12 bg-muted/20" />
                    </tr>
                  ))
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={isCashier ? 5 : 6} className="text-center py-10 text-muted-foreground italic">No sales recorded yet.</td>
                  </tr>
                ) : (
                  sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{new Date(sale.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium">{sale.product?.name}</td>
                      <td className="px-4 py-3 text-center">{sale.quantity}</td>
                      <td className="px-4 py-3 text-right">₦{sale.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold">₦{sale.totalAmount.toLocaleString()}</td>
                      {!isCashier && (
                        <td className="px-4 py-3 text-right text-green-600 font-semibold">₦{(sale.profit || 0).toLocaleString()}</td>
                      )}
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
