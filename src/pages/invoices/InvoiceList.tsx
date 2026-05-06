import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Search,
  SortAsc,
  SortDesc,
  Eye,
  Download,
  Printer,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBillings, getBillingById, Billing } from "@/apis/billingApi";
import { pingUser } from "@/apis/pingapi";
import { getShop } from "@/apis/shopapi";
import { printInvoice } from "@/lib/utils";
import { getProducts } from "@/apis/productapis";

type BillingRow = {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  shopName: string;
  createdAt: string;
  total: number;
  itemsCount: number;
  paymentStatus: string;
  createdByRole?: string;
  invoiceType?: string;
  createdBy?: string;
};

const InvoiceList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [shopId, setShopId] = useState<string>("");
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAdminOrOwner = useMemo(() => {
    const role =
      (sessionStorage.getItem("user_data") &&
        JSON.parse(sessionStorage.getItem("user_data") as string)?.role) ||
      "";
    return ["Admin", "Owner"].includes(role);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const ping = await pingUser();
        const role = ping.user?.role || "";
        const managed = ping.user?.managedShops || [];
        if (role === "Admin" || role.toLowerCase() === "owner") {
          const all: any = await getShop();
          const allShops = (
            Array.isArray(all) ? all : all?.shops || all?.data || []
          ).map((s: any) => ({ id: s.id, name: s.name }));
          setShops(allShops);
          if (!shopId && allShops[0]) setShopId(allShops[0].id);
        } else if (managed.length > 0) {
          setShops(managed.map((s) => ({ id: s.id, name: s.name })) as any);
          if (!shopId) setShopId(managed[0].id);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!shopId && !isAdminOrOwner) return;
      setLoading(true);
      try {
        let billings: any[] = [];
        
        if (isAdminOrOwner) {
          // For admin/owner, get all billings from all shops
          const allShops = shops.map(s => s.id);
          const allBillings = await Promise.all(
            allShops.map(async (shopId) => {
              try {
                return await getBillings(shopId);
              } catch (error) {
                console.error(`Error fetching billings for shop ${shopId}:`, error);
                return [];
              }
            })
          );
          billings = allBillings.flat();
        } else {
          // For shop owners, get billings for their managed shops
          billings = await getBillings(shopId);
        }
        
        const mapped: BillingRow[] = billings.map((b: any) => ({
          id: b.id,
          customerName: b.customerName,
          shopName: b.shop?.name || "Factory Invoice",
          createdAt: b.createdAt,
          total: b.total,
          itemsCount: Array.isArray(b.items) ? b.items.length : 0,
          paymentStatus: b.paymentStatus,
          createdByRole: b.createdByRole,
          invoiceNumber: b.invoiceNumber,
          invoiceType: b.invoiceType || "SHOP",
          createdBy: b.createdBy,
        }));
        setRows(mapped);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId, isAdminOrOwner, shops]);

  const handleViewInvoice = async (invoiceId: string) => {
    setActionLoading(invoiceId);
    try {
      const billing: Billing = await getBillingById(invoiceId);

      // Fetch product details for items that don't have product names
      const productIds = billing.items
        .filter((item: any) => !item.productName)
        .map((item: any) => item.productId);

      let products: any[] = [];
      if (productIds.length > 0) {
        try {
          products = await getProducts();
        } catch (error) {
          console.error("Error fetching products:", error);
        }
      }

      // Create a map of product ID to product name
      const productMap = new Map();
      products.forEach((product) => {
        productMap.set(product.id, product.name);
      });

      // Open invoice details in a new tab
      const newWindow = window.open("", "_blank", "width=320,height=600");
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invoice ${billing.invoiceNumber || billing.id}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 8px; 
                font-size: 12px;
                line-height: 1.2;
                max-width: 300px;
              }
              .header { border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 10px; }
              .invoice-details { margin-bottom: 10px; }
              .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
              .items-table th, .items-table td { border: 1px solid #ddd; padding: 4px; text-align: left; }
              .items-table th { background-color: #f2f2f2; }
              .totals { margin-top: 10px; text-align: right; }
              .total-row { font-weight: bold; font-size: 1.1em; }
              @media print {
                body { margin: 0; padding: 4px; }
                @page { margin: 0; size: 80mm 200mm; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Invoice ${billing.invoiceNumber || billing.id}</h1>
              <p><strong>Shop:</strong> ${billing.shop.name}</p>
              <p><strong>Customer:</strong> ${billing.customerName || "N/A"}</p>
              <p><strong>Date:</strong> ${new Date(
                billing.createdAt
              ).toLocaleDateString()}</p>
            </div>
            <div class="invoice-details">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${billing.items
                    .map((item: any) => {
                      const productName =
                        item.productName ||
                        productMap.get(item.productId) ||
                        `Product ${item.productId}`;
                      return `
                      <tr>
                        <td>${productName}</td>
                        <td>${item.quantity}</td>
                        <td>₹${item.unitPrice.toFixed(2)}</td>
                        <td>₹${(item.quantity * item.unitPrice).toFixed(2)}</td>
                      </tr>
                    `;
                    })
                    .join("")}
                </tbody>
              </table>
              <div class="totals">
                <p>Subtotal: ₹${billing.subtotal.toFixed(2)}</p>
                <p>GST Included (5%): ₹${billing.tax.toFixed(2)}</p>
                <p class="total-row">Total: ₹${billing.total.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> ${billing.paymentMethod || "N/A"}</p>
                ${
                  Array.isArray(billing.paymentBreakdown) && billing.paymentBreakdown.length > 0
                    ? `<p><strong>Partial Payments:</strong> ${billing.paymentBreakdown
                        .map((p: any) => `${p.paymentMethodName}: ₹${Number(p.amount || 0).toFixed(2)}`)
                        .join(", ")}</p>`
                    : ""
                }
                <p><strong>Status:</strong> ${billing.paymentStatus}</p>
              </div>
            </div>
          </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      alert("Failed to load invoice details");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    setActionLoading(invoiceId);
    try {
      const billing: Billing = await getBillingById(invoiceId);

      // Fetch product details for items that don't have product names
      const productIds = billing.items
        .filter((item: any) => !item.productName)
        .map((item: any) => item.productId);

      let products: any[] = [];
      if (productIds.length > 0) {
        try {
          products = await getProducts();
        } catch (error) {
          console.error("Error fetching products:", error);
        }
      }

      // Create a map of product ID to product name
      const productMap = new Map();
      products.forEach((product) => {
        productMap.set(product.id, product.name);
      });

      const shop = billing.shop;
      const outletName =
        billing.invoiceType === "FACTORY" ? "Factory" : shop?.name || "";

      // Convert billing data to the format expected by printInvoice
      const formattedData = {
        customerName: billing.customerName || "N/A",
        customer: billing.customerName || "N/A",
        customerContact: billing.customerContact || "",
        contactNumber: billing.customerContact || "",
        shopName: outletName,
        shop: outletName,
        invoiceNumber: billing.invoiceNumber || billing.id,
        invoiceDate: billing.createdAt,
        shopAddress:
          (shop?.address || "").trim() ||
          "Shree Foods private limited 30,\nDev industrial area, BIDC, Gorwa, Vadodara.",
        shopContact: shop?.contactNumber || "",
        tax: billing.tax,
        discount: billing.discount,
        total: billing.total,
        paymentMethod: billing.paymentMethod || "",
        items: billing.items.map((item: any) => ({
          name:
            item.productName ||
            productMap.get(item.productId) ||
            `Product ${item.productId}`,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          price: item.unitPrice,
        })),
        notes: "",
      };

      // Use the print function which will open a print dialog
      printInvoice(formattedData);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Failed to download invoice");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrintInvoice = async (invoiceId: string) => {
    // Same as download for now, as printInvoice opens print dialog
    await handleDownloadInvoice(invoiceId);
  };

  const filtered = rows
    .filter((r) => {
      const matchesText =
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.customerName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        r.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || r.paymentStatus === statusFilter;
      const matchesInvoiceType =
        invoiceTypeFilter === "all" || r.invoiceType === invoiceTypeFilter;
      return matchesText && matchesStatus && matchesInvoiceType;
    })
    .sort((a, b) => {
      let av: any;
      let bv: any;
      switch (sortBy) {
        case "total":
          av = a.total;
          bv = b.total;
          break;
        case "itemsCount":
          av = a.itemsCount;
          bv = b.itemsCount;
          break;
        case "createdAt":
        default:
          av = new Date(a.createdAt).getTime();
          bv = new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Invoice Management
          </h1>
          <p className="text-muted-foreground">
            Manage all your customer invoices
          </p>
        </div>
        <Link to="/invoices/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create New Invoice
          </Button>
        </Link>
      </div>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {shops.length > 0 && isAdminOrOwner && (
              <div>
                <label className="text-sm font-medium mb-2 block">Shop Filter</label>
                <select
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="">All Shops</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-2 w-full"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Invoice Type</label>
              <select
                value={invoiceTypeFilter}
                onChange={(e) => setInvoiceTypeFilter(e.target.value)}
                className="border rounded-md px-3 py-2 w-full"
              >
                <option value="all">All Types</option>
                <option value="SHOP">Shop Invoice</option>
                <option value="FACTORY">Factory Invoice</option>
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="total">Amount</option>
                  <option value="itemsCount">Items Count</option>
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="self-end"
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Invoice Number</th>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Shop/Type</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Items</th>
                  <th className="text-left p-3 font-medium">Amount (₹)</th>
                  <th className="text-left p-3 font-medium">Created By</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{r.invoiceNumber}</td>
                    <td className="p-3">{r.customerName || "-"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span>{r.shopName}</span>
                        {r.invoiceType === "FACTORY" && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Factory
                          </Badge>
                        )}
                        {r.createdByRole &&
                          r.createdByRole.toLowerCase() === "admin" && (
                            <Badge variant="outline">Admin</Badge>
                          )}
                      </div>
                    </td>
                    <td className="p-3">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3">{r.itemsCount}</td>
                    <td className="p-3">₹ {r.total.toFixed(2)}</td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div className="font-medium">
                          {r.createdByRole === "Admin" ? "Admin" : "Shop Owner"}
                        </div>
                        {r.createdBy && (
                          <div className="text-gray-500 text-xs">
                            ID: {r.createdBy.substring(0, 8)}...
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(r.id)}
                          className="h-8 w-8 p-0"
                          title="View Invoice"
                          disabled={actionLoading === r.id}
                        >
                          {actionLoading === r.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice(r.id)}
                          className="h-8 w-8 p-0"
                          title="Download PDF"
                          disabled={actionLoading === r.id}
                        >
                          {actionLoading === r.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintInvoice(r.id)}
                          className="h-8 w-8 p-0"
                          title="Print Invoice"
                          disabled={actionLoading === r.id}
                        >
                          {actionLoading === r.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={9}>
                      No invoices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default InvoiceList;
