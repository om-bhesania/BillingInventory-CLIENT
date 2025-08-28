import { Button } from "@/components/ui/button";
import { PencilIcon, Trash2 } from "lucide-react";

export const shopColumns: any = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Shop Name" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "contactNumber", header: "Contact" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "operatingHours", header: "Hours" },
  { accessorKey: "isActive", header: "Active" },
  { accessorKey: "_count.inventory", header: "Inventory" },
  { accessorKey: "_count.restockRequests", header: "Restocks" },
  {
    accessorKey: "manager.managerName",
    header: "Manager",
    Cell: ({ row }) => {
      const manager = row.original.manager;
      return manager ? manager.name : "N/A";
    },
  },
  {
    accessorKey: "Actions",
    header: "Actions",
    Cell: ({ row }) => {
      const id = row.original.id as string;
      const handleEdit = () => {
        window.dispatchEvent(new CustomEvent("shop:edit", { detail: { id } }));
      };
      const handleDelete = () => {
        window.dispatchEvent(
          new CustomEvent("shop:delete", { detail: { id } })
        );
      };
      return (
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="icon" onClick={handleEdit}>
            <span className="sr-only">Edit</span>
            <PencilIcon />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete}>
            <span className="sr-only">Delete</span>
            <Trash2 />
          </Button>
        </div>
      );
    },
  },
];
