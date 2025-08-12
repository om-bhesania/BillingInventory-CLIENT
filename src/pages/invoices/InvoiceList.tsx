
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@tremor/react";
import { Filter, Plus, Printer, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

// Mock invoices data
const mockInvoices = Array.from({ length: 10 }).map((_, i) => ({
  id: `INV${10000 + i}`,
  customer: `Customer ${i + 1}`,
  shop: `Shop ${String.fromCharCode(65 + (i % 5))}`,
  date: new Date(2023, 11 - (i % 6), 15 - (i % 15)).toLocaleDateString(),
  amount: 500 + Math.floor(Math.random() * 2000),
  items: 2 + Math.floor(Math.random() * 5),
  status: i % 4 === 0 ? 'Pending' : i % 4 === 1 ? 'Paid' : i % 4 === 2 ? 'Cancelled' : 'Draft',
}));

const InvoiceList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState(mockInvoices);

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.shop.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setInvoices(invoices.filter((invoice) => invoice.id !== id));
    Swal.fire({
      title: "Invoice Deleted",
      text: `Invoice ${id} has been deleted successfully.`,
      icon: "success",
    });
  };

  const handlePrint = (id: string) => {
    Swal.fire({
      title: "Print Requested",
      text: `Printing invoice ${id}...`,
      icon: "info", 
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

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
        <Button asChild>
          <Link to="/invoices/add">
            <Plus className="mr-2 h-4 w-4" /> Create New Invoice
          </Link>
        </Button>
      </div>

      <Separator className="my-6" />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search invoices..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto flex">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal">
              Status
            </DropdownMenuLabel>
            <DropdownMenuItem className="flex items-center gap-2">
              Paid
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              Cancelled
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              Draft
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-6 rounded-md border">
        {/* <Table>
          <TableHeaderCell className="flex items-center justify-between gap-12 !w-full">
            <TableRow className="bg-muted flex items-center justify-between !flex-row w-full">
              <TableHead>Invoice ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Amount (₹)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeaderCell>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="text-primary hover:underline"
                    >
                      {invoice.id}
                    </Link>
                  </TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell>{invoice.shop}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.items}</TableCell>
                  <TableCell className="text-right">
                    {invoice.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePrint(invoice.id)}
                      >
                        <Printer className="h-4 w-4" />
                        <span className="sr-only">Print</span>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/invoices/edit/${invoice.id}`}>
                          <span className="sr-only">Edit</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(invoice.id)}
                      >
                        <span className="sr-only">Delete</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table> */}
      </div>
    </>
  );
};

export default InvoiceList;
