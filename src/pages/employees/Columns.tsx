import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const employeeColumns = [
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
    cell: ({ row }) => row.original.shopName ? row.original.shopName : "No Shop",
  },
  {
    accessorKey: "Actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Link to={`/employees/${row.original.id}/edit`}>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </Link>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </div>
    ),
  },
];
