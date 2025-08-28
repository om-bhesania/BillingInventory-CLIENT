
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, SortAsc, SortDesc } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBillings } from "@/apis/billingApi";
import { pingUser } from "@/apis/pingapi";
import { getShop } from "@/apis/shopapi";

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
};

const InvoiceList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [shopId, setShopId] = useState<string>("");
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const isAdminOrOwner = useMemo(() => {
    const role = (sessionStorage.getItem("user_data") && JSON.parse(sessionStorage.getItem("user_data") as string)?.role) || "";
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
          const allShops = (Array.isArray(all) ? all : all?.shops || all?.data || []).map((s: any) => ({ id: s.id, name: s.name }));
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
      if (!shopId) return;
      setLoading(true);
      try {
        const billings = await getBillings(shopId);
        const mapped: BillingRow[] = billings.map((b: any) => ({
          id: b.id,
          customerName: b.customerName,
          shopName: b.shop?.name || "",
          createdAt: b.createdAt,
          total: b.total,
          itemsCount: Array.isArray(b.items) ? b.items.length : 0,
          paymentStatus: b.paymentStatus,
          createdByRole: b.createdByRole,
          invoiceNumber: b.invoiceNumber,
        }));
        setRows(mapped);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId]);

  const filtered = rows
    .filter((r) => {
      const matchesText =
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.shopName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.paymentStatus === statusFilter;
      return matchesText && matchesStatus;
    })
    .sort((a, b) => {
      let av: any;
      let bv: any;
      switch (sortBy) {
        case "total":
          av = a.total; bv = b.total; break;
        case "itemsCount":
          av = a.itemsCount; bv = b.itemsCount; break;
        case "createdAt":
        default:
          av = new Date(a.createdAt).getTime();
          bv = new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoice Management</h1>
          <p className="text-muted-foreground">Manage all your customer invoices</p>
        </div>
        <Button asChild>
          <Link to="/invoices/add">
            <Plus className="mr-2 h-4 w-4" /> Create New Invoice
          </Link>
        </Button>
      </div>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {shops.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Shop</label>
                <select
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
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

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Sort by</label>
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
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="self-end"
              >
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
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
                  <th className="text-left p-3 font-medium">Shop</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Items</th>
                  <th className="text-left p-3 font-medium">Amount (₹)</th>
                  <th className="text-left p-3 font-medium">Status</th>
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
                        {r.createdByRole && r.createdByRole.toLowerCase() === 'admin' && (
                          <Badge variant="outline">Admin</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="p-3">{r.itemsCount}</td>
                    <td className="p-3">{r.total.toFixed(2)}</td>
                    <td className="p-3">
                      <Badge variant={r.paymentStatus === "paid" ? "default" : r.paymentStatus === "pending" ? "secondary" : "destructive"}>
                        {r.paymentStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={7}>No invoices found</td>
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
