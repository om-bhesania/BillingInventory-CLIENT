import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PencilIcon, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { updateEmployeeStatus } from "@/apis/employeeapi";

export const employeeColumns = (handleDelete: (id: string) => void, refreshData?: () => void) => [
  {
    accessorKey: "id",
    header: "S/N",
    cell: ({ row: { index } }) => index + 1,
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "contact",
    header: "Contact",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "shopName",
    header: "Shop",
    cell: ({ row }) =>
      row.original.shopName ? row.original.shopName : "No Shop",
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const handleStatusChange = async (checked: boolean) => {
        try {
          const employeeId = row.original.publicId || row.original.id;
          console.log(`Updating status for employee ${employeeId} to ${checked}`);
          await updateEmployeeStatus(employeeId, checked);
          console.log(`Status updated successfully for employee ${employeeId}`);
          // Refresh the data if callback is provided
          if (refreshData) {
            refreshData();
          } else {
            window.location.reload(); // Fallback
          }
        } catch (error) {
          console.error("Error updating employee status:", error);
          // Revert the switch state on error
          if (refreshData) {
            refreshData();
          } else {
            window.location.reload(); // Fallback
          }
        }
      };

      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={row.original.isActive}
            onCheckedChange={handleStatusChange}
            disabled={false}
          />
          <span className="text-sm text-muted-foreground">
            {row.original.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    enableSorting: false,
    enableColumnFilter: false,
    Cell: ({ row }) => {
      console.log("Rendering actions cell for row:", row.original);
      return (
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="icon">
            <Link to={`/employees/edit/id=${row.original.publicId}`}>
              <PencilIcon />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              console.log("Delete button clicked for employee:", row.original);
              console.log(
                "Employee ID:",
                row.original.publicId || row.original.id
              );
              handleDelete(row.original.publicId || row.original.id);
            }}
          >
            <Trash2 />
          </Button>
        </div>
      );
    },
  },
];
