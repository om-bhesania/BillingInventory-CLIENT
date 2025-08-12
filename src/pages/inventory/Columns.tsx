import { Button } from "@/components/ui/button";
import { PencilIcon, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export const InvoiceColumns = (handleDelete: any) => {
  return [
    {
      accessorKey: "id",
      header: "ID",
      Cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "sku",
      header: "SKU",
    },
    {
      accessorKey: "category.name",
      header: "Category",
    },
    {
      accessorKey: "flavor.name",
      header: "Flavor",
    },
    {
      accessorKey: "totalStock",
      header: "Total Stock",
    },
    {
      accessorKey: "minStockLevel",
      header: "Min Stock",
    },
    {
      accessorKey: "unitPrice",
      header: "Unit Price (₹)",
    },
    {
      accessorKey: "Actions",
      header: "Actions",
      Cell: ({ row }) => (
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/inventory/edit/id=${row.original.id}`}>
              <span className="sr-only">Edit</span>
              <PencilIcon />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
          >
            <span className="sr-only">Delete</span>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];
};
