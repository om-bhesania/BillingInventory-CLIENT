import { Button } from "@/components/ui/button";
import { PencilIcon, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export const InventoryColumns = (handleDelete: (id: string) => void) => [
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
    header: "Actions",
    Cell: ({ row }) => (
      <div className="flex justify-end space-x-2">
        <Button variant="ghost" size="icon">
          <Link to={`/inventory/edit/id=${row.original.id}`}>
            <PencilIcon />
          </Link>
        </Button>
        <Button 
          variant="ghost"
          size="icon"
          onClick={() => handleDelete(row.original.id)}
        >
          <Trash2 />
        </Button>
      </div>
    ),
  },
];
