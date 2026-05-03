import { deleteProduct, editProduct, getProducts } from "@/apis/productapis";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Table from "@/components/ui/material-table";
import useToast from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Plus, Table2 } from "lucide-react";
import type { MRT_RowSelectionState } from "material-react-table";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { InventoryColumns } from "./Columns";

type ProductDraft = {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  totalStock: string;
  minStockLevel: string;
  unitPrice: string;
  retailPrice: string;
  costPrice: string;
  quantityInLiters: string;
};

function productToDraft(p: Record<string, unknown>): ProductDraft {
  const category = p.category as { name?: string } | undefined;
  return {
    id: String(p.id),
    name: String(p.name ?? ""),
    sku: String(p.sku ?? ""),
    categoryName: String(category?.name ?? ""),
    totalStock: String(p.totalStock ?? 0),
    minStockLevel:
      p.minStockLevel === null || p.minStockLevel === undefined
        ? ""
        : String(p.minStockLevel),
    unitPrice: String(p.unitPrice ?? 0),
    retailPrice: String(p.retailPrice ?? 0),
    costPrice: String(p.costPrice ?? 0),
    quantityInLiters: String(p.quantityInLiters ?? 0),
  };
}

function buildProductUpdatePayload(
  original: Record<string, unknown>,
  draft: ProductDraft
) {
  const totalStock = Math.max(0, Math.floor(Number(draft.totalStock)));
  const unitPrice = Number(draft.unitPrice);
  const retailPrice = Number(draft.retailPrice);
  const costPrice = Number(draft.costPrice);
  const quantityInLiters = Number(draft.quantityInLiters);
  const minRaw = draft.minStockLevel.trim();
  const minStockLevel =
    minRaw === "" ? null : Math.max(0, Math.floor(Number(minRaw)));

  if (
    !Number.isFinite(totalStock) ||
    !Number.isFinite(unitPrice) ||
    !Number.isFinite(retailPrice) ||
    !Number.isFinite(costPrice) ||
    !Number.isFinite(quantityInLiters) ||
    (minRaw !== "" && !Number.isFinite(minStockLevel))
  ) {
    throw new Error(`Invalid numbers for product: ${draft.name}`);
  }

  const category = original.category as { id: string } | undefined;
  const flavor = original.flavor as { id: string } | undefined;
  const packaging = original.packagingType as { id: string } | undefined;

  const payload: Record<string, unknown> = {
    sku: original.sku,
    name: original.name,
    description: (original.description as string | null) ?? null,
    categoryId: category?.id ?? (original.categoryId as string),
    flavorId: flavor?.id ?? (original.flavorId as string),
    packagingTypeId: packaging?.id ?? (original.packagingTypeId as string) ?? null,
    quantityInLiters,
    unitSize: Number(original.unitSize ?? 0),
    unitMeasurement: String(original.unitMeasurement ?? ""),
    unitPrice,
    costPrice,
    retailPrice,
    totalStock,
    minStockLevel,
    barcode: (original.barcode as string | null) ?? null,
    imageUrl: (original.imageUrl as string | null) ?? null,
    isActive: original.isActive !== false,
  };
  if (!payload.packagingTypeId) {
    delete payload.packagingTypeId;
  }
  return payload;
}

const InventoryList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [inventory, setInventory] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetRows, setSheetRows] = useState<ProductDraft[]>([]);
  const [sheetSaving, setSheetSaving] = useState(false);
  const { toast } = useToast();

  const fetchProductsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProducts();
      setInventory(Array.isArray(response) ? (response as any[]) : []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsData();
  }, []);

  const filteredInventory = useMemo(
    () =>
      inventory.filter(
        (item) =>
          String(item?.name ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          String(item?.sku ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      ),
    [inventory, searchTerm]
  );

  useEffect(() => {
    setRowSelection((prev) => {
      const ids = new Set(filteredInventory.map((p) => String(p.id)));
      const next = { ...prev };
      let changed = false;
      for (const key of Object.keys(next)) {
        if (!ids.has(key)) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [filteredInventory]);

  const selectedProducts = useMemo(
    () => filteredInventory.filter((p) => rowSelection[String(p.id)]),
    [filteredInventory, rowSelection]
  );

  const handleDelete = async (id: string) => {
    try {
      const res: any = await deleteProduct(id);
      toast({
        title: "Product Deleted",
        text: `Product ${res.message} has been deleted successfully.`,
        type: "success",
      });
      setRowSelection((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
      fetchProductsData();
    } catch (error) {
      toast({
        title: "Something went wrong",
        text: "Please wait for sometimes and try again",
        type: "error",
      });
    }
  };

  const tableOptions = useMemo(
    () => ({
      enableRowSelection: true,
      onRowSelectionChange: setRowSelection,
      state: { rowSelection },
      getRowId: (row: Record<string, unknown>) => String(row.id),
      muiTableBodyRowProps: ({
        row,
      }: {
        row: { getToggleSelectedHandler: () => (e: unknown) => void };
      }) => ({
        onClick: (e: React.MouseEvent) => {
          const t = e.target as HTMLElement;
          if (t.closest("a, button, input, textarea, select, [role='checkbox']")) {
            return;
          }
          row.getToggleSelectedHandler()(e);
        },
        sx: { cursor: "pointer" },
      }),
    }),
    [rowSelection]
  );

  const openBulkSheet = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Select products",
        text: "Use the checkboxes or click a row to select products, then open the bulk sheet.",
        type: "error",
      });
      return;
    }
    setSheetRows(selectedProducts.map((p) => productToDraft(p)));
    setSheetOpen(true);
  };

  const updateDraft = (id: string, patch: Partial<ProductDraft>) => {
    setSheetRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const saveBulkSheet = async () => {
    const byId = new Map(selectedProducts.map((p) => [String(p.id), p]));
    setSheetSaving(true);
    try {
      for (const draft of sheetRows) {
        const original = byId.get(draft.id);
        if (!original) continue;
        const payload = buildProductUpdatePayload(original, draft);
        await editProduct(payload as never, draft.id);
      }
      toast({
        title: "Saved",
        text: `Updated ${sheetRows.length} product(s).`,
        type: "success",
      });
      setSheetOpen(false);
      setRowSelection({});
      await fetchProductsData();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string; message?: string } } })?.response?.data
          ?.error ||
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Save failed";
      toast({
        title: "Bulk save failed",
        text: String(msg),
        type: "error",
      });
    } finally {
      setSheetSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Manage your ice cream inventory across all shops
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openBulkSheet}
            disabled={selectedProducts.length === 0}
            className="flex items-center gap-2"
          >
            <Table2 className="h-4 w-4 shrink-0" />
            Bulk edit sheet ({selectedProducts.length})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRowSelection({})}
            disabled={Object.keys(rowSelection).length === 0}
          >
            Clear selection
          </Button>
          <Button asChild size="sm">
            <Link to="/inventory/add" className="flex items-center">
              <Plus className="mr-2 h-4 w-4" /> Add New Item
            </Link>
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="mt-6">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2 mb-4 w-full md:w-1/3"
        />
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchProductsData} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <Table
            columns={InventoryColumns(handleDelete)}
            data={filteredInventory}
            options={tableOptions}
          />
        )}
      </div>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] flex flex-col sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Bulk edit products (spreadsheet)</DialogTitle>
            <DialogDescription>
              Edit numeric fields like a spreadsheet. Name and SKU are read-only;
              other product fields are sent with each save using the current
              server update rules.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto flex-1 min-h-0 rounded-md border">
            <table
              className={cn(
                "w-full border-collapse text-sm",
                "[&_th]:border [&_td]:border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left",
                "[&_td]:p-0"
              )}
            >
              <thead>
                <tr>
                  <th className="w-8">#</th>
                  <th className="min-w-[120px]">Name</th>
                  <th className="min-w-[88px]">SKU</th>
                  <th className="min-w-[100px]">Category</th>
                  <th className="min-w-[88px]">Total stock</th>
                  <th className="min-w-[88px]">Min stock</th>
                  <th className="min-w-[88px]">MRP (₹)</th>
                  <th className="min-w-[88px]">Retail (₹)</th>
                  <th className="min-w-[88px]">Cost (₹)</th>
                  <th className="min-w-[100px]">Qty (L)</th>
                </tr>
              </thead>
              <tbody>
                {sheetRows.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="bg-muted/30 text-center text-muted-foreground px-1">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-1 align-middle">{row.name}</td>
                    <td className="px-2 py-1 align-middle text-muted-foreground">
                      {row.sku}
                    </td>
                    <td className="px-2 py-1 align-middle">{row.categoryName}</td>
                    <td className="align-middle">
                      <Input
                        type="number"
                        min={0}
                        className="h-9 rounded-none border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-inset"
                        value={row.totalStock}
                        onChange={(e) =>
                          updateDraft(row.id, { totalStock: e.target.value })
                        }
                      />
                    </td>
                    <td className="align-middle">
                      <Input
                        type="number"
                        min={0}
                        placeholder="—"
                        className="h-9 rounded-none border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-inset"
                        value={row.minStockLevel}
                        onChange={(e) =>
                          updateDraft(row.id, { minStockLevel: e.target.value })
                        }
                      />
                    </td>
                    <td className="align-middle">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-9 rounded-none border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-inset"
                        value={row.unitPrice}
                        onChange={(e) =>
                          updateDraft(row.id, { unitPrice: e.target.value })
                        }
                      />
                    </td>
                    <td className="align-middle">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-9 rounded-none border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-inset"
                        value={row.retailPrice}
                        onChange={(e) =>
                          updateDraft(row.id, { retailPrice: e.target.value })
                        }
                      />
                    </td>
                    <td className="align-middle">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-9 rounded-none border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-inset"
                        value={row.costPrice}
                        onChange={(e) =>
                          updateDraft(row.id, { costPrice: e.target.value })
                        }
                      />
                    </td>
                    <td className="align-middle">
                      <Input
                        type="number"
                        min={0}
                        step="0.001"
                        className="h-9 rounded-none border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-inset"
                        value={row.quantityInLiters}
                        onChange={(e) =>
                          updateDraft(row.id, {
                            quantityInLiters: e.target.value,
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSheetOpen(false)}
              disabled={sheetSaving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveBulkSheet} disabled={sheetSaving}>
              {sheetSaving ? "Saving…" : "Save all"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InventoryList;
