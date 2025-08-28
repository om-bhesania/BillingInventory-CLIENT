import { getActionsColumn } from "@/lib/columnEvents";

export const invoiceColumns: any = [
  {
    accessorKey: "invoiceNumber",
    header: "Invoice Number",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "Actions",
    header: "Actions",
    cell: () =>
      getActionsColumn("Edit", () => {
        console.log("Edit action triggered");
      }),
  },
];
