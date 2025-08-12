export const shopColumns:any = [
  {
    accessorKey: "id",
    header: "ID",
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
    accessorKey: "contactNumber",
    header: "Contact Number",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "operatingHours",
    header: "Operating Hours",
  },
  {
    accessorKey: "openingDate",
    header: "Opening Date",
    Cell: ({ value }) => new Date(value).toLocaleDateString(),
  },
  {
    accessorKey: "managerName",
    header: "Manager Name",
  },
  {
    accessorKey: "maxCapacity",
    header: "Max Capacity",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "logoUrl",
    header: "Logo URL",
  },
];
