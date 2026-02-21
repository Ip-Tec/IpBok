"use client";
import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Edit, Trash2, Package, MoreVertical, DollarSign, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";

export default function ProductsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role?.toUpperCase();
  const isCashier = userRole === "CASHIER";

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategoryLoading, setIsCreatingCategoryLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    costPrice: "",
    sellingPrice: "",
    minPrice: "",
    maxPrice: "",
    stockQuantity: "",
    categoryId: "",
  });

  const [profitCalc, setProfitCalc] = useState<{ min: number; max: number; fixed: number }>({ min: 0, max: 0, fixed: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateProfit();
  }, [formData.costPrice, formData.sellingPrice, formData.minPrice, formData.maxPrice]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/retail/products"),
        fetch("/api/retail/categories")
      ]);
      
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProfit = () => {
    const cost = parseFloat(formData.costPrice) || 0;
    const sell = parseFloat(formData.sellingPrice) || 0;
    const min = parseFloat(formData.minPrice) || 0;
    const max = parseFloat(formData.maxPrice) || 0;

    let fixed = sell - cost;
    let minProf = min > 0 ? min - cost : 0;
    let maxProf = max > 0 ? max - cost : 0;

    setProfitCalc({ min: minProf, max: maxProf, fixed });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsCreatingCategoryLoading(true);
    try {
      const res = await fetch("/api/retail/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create category");
      const newCat = await res.json();
      setCategories([...categories, newCat]);
      setFormData({ ...formData, categoryId: newCat.id });
      setIsCreatingCategory(false);
      setNewCategoryName("");
      toast.success("Category created successfully");
    } catch (error) {
      toast.error("Failed to create category");
    } finally {
      setIsCreatingCategoryLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!formData.name || !formData.costPrice || (!formData.sellingPrice && !formData.minPrice)) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const res = await fetch("/api/retail/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Product created successfully");
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          description: "",
          sku: "",
          costPrice: "",
          sellingPrice: "",
          minPrice: "",
          maxPrice: "",
          stockQuantity: "",
          categoryId: "",
        });
        fetchData();
      } else {
        toast.error("Failed to create product");
      }
    } catch (error) {
      toast.error("Error creating product");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Inventory Management
          </h1>
          <p className="text-muted-foreground text-sm">Manage products, stock levels, and pricing.</p>
        </div>
        
        {!isCashier && (
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" /> Add New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Retail Product</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" placeholder="e.g. iPhone 15 Pro" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Model Number</Label>
                  <Input id="sku" placeholder="Optional" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="category">Category</Label>
                    <Button 
                      type="button" 
                      variant="link" 
                      className="h-auto p-0 text-xs text-primary" 
                      onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                    >
                      {isCreatingCategory ? "Select Existing" : "+ New Category"}
                    </Button>
                  </div>
                  {isCreatingCategory ? (
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Category Name" 
                        value={newCategoryName} 
                        onChange={e => setNewCategoryName(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                      />
                      <Button type="button" onClick={handleCreateCategory} disabled={isCreatingCategoryLoading || !newCategoryName.trim()}>
                        {isCreatingCategoryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                      </Button>
                    </div>
                  ) : (
                    <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qty">Initial Stock Quantity *</Label>
                  <Input id="qty" type="number" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost Price (₦) *</Label>
                  <Input id="cost" type="number" placeholder="What you paid" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sell">Fixed Selling Price (₦)</Label>
                  <Input id="sell" type="number" placeholder="Standard retail price" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} />
                </div>
                
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Price Range (Optional)</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="min">Min Selling Price (₦)</Label>
                      <Input id="min" type="number" placeholder="Min" value={formData.minPrice} onChange={e => setFormData({...formData, minPrice: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max">Max Selling Price (₦)</Label>
                      <Input id="max" type="number" placeholder="Max" value={formData.maxPrice} onChange={e => setFormData({...formData, maxPrice: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea id="desc" placeholder="Product details..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                {/* Profit Preview */}
                <div className="md:col-span-2 p-4 bg-primary/5 rounded-lg border-2 border-primary/10">
                  <h4 className="flex items-center gap-2 text-sm font-bold mb-3">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Estimated Profit Preview
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {formData.sellingPrice && (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded border border-primary/20">
                        <p className="text-xs text-muted-foreground uppercase">Fixed Profit Per Unit</p>
                        <p className={`text-lg font-bold ${profitCalc.fixed < 0 ? 'text-red-500' : 'text-green-600'}`}>
                          ₦{profitCalc.fixed.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {(formData.minPrice || formData.maxPrice) && (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded border border-primary/20">
                        <p className="text-xs text-muted-foreground uppercase">Profit Range</p>
                        <p className="text-lg font-bold text-green-600">
                          ₦{profitCalc.min.toLocaleString()} - ₦{profitCalc.max.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {!formData.sellingPrice && !formData.minPrice && (
                      <p className="text-xs text-muted-foreground italic">Enter selling prices to see profit estimation.</p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateProduct}>Save Product</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products or SKU..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-muted rounded-xl" />)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
          <Package className="w-12 h-12 text-muted mb-4" />
          <h3 className="text-xl font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground">Start by adding your first product to your inventory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-2 bg-primary" />
              <CardHeader className="pb-3 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                    <CardDescription className="text-xs">SKU: {product.sku || "N/A"}</CardDescription>
                  </div>
                  {!isCashier && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted/40 rounded">
                    <p className="text-[10px] uppercase text-muted-foreground">Stock</p>
                    <p className={`font-bold ${product.stockQuantity < 5 ? 'text-red-500' : 'text-foreground'}`}>
                      {product.stockQuantity} units
                    </p>
                  </div>
                  <div className="p-2 bg-muted/40 rounded">
                    <p className="text-[10px] uppercase text-muted-foreground">Category</p>
                    <p className="font-medium truncate">{product.category?.name || "Uncategorized"}</p>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t">
                  {!isCashier && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cost Price:</span>
                      <span className="font-semibold">₦{product.costPrice?.toLocaleString() || "0"}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Selling Price:</span>
                    <span className="font-bold text-primary">
                      {product.sellingPrice ? `₦${product.sellingPrice.toLocaleString()}` : `₦${product.minPrice.toLocaleString()} - ₦${product.maxPrice.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                {!isCashier && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-900/50">
                      <span className="text-xs font-semibold text-green-700 dark:text-green-500 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> Est. Profit (per unit)
                      </span>
                      <span className="text-sm font-bold text-green-700 dark:text-green-500">
                        ₦{( (product.sellingPrice || product.minPrice) - product.costPrice).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
