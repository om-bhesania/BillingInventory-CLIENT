import { Button } from "@/components/ui/button";
import { clsx, type ClassValue } from "clsx";
import { Plus, Trash2 } from "lucide-react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const formatInvoiceForPrint = (formData: any) => {
  const subtotal = formData.items.reduce(
    (t: number, i: any) => t + i.price * i.quantity,
    0
  );
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  let receipt = "";

  // Header
  receipt += "        Shree Foods\n";
  receipt += "================================\n";
  receipt += "Blizz Ice Cream Company\n";
  receipt += "123 Business Street, City Center\n";
  receipt += "Mumbai, Maharashtra 400001, IN\n";
  receipt += "PHONE: +91-9876543210\n";
  receipt += "GSTIN: 27ABCDE1234F1Z5\n";
  receipt += "================================\n";

  // Bill Details
  const billNo =
    formData.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
  const date = new Date(formData.invoiceDate)
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/\//g, " - ");

  receipt += `Bill No: ${billNo}`.padEnd(20) + `Date: ${date}\n`;
  receipt += "================================\n";

  // Customer Details
  receipt += `Customer: ${formData.customer}\n`;
  if (formData.contactNumber) {
    receipt += `Phone: ${formData.contactNumber}\n`;
  }
  receipt += `Shop: ${formData.shop}\n`;
  receipt += "================================\n";

  // Items Table Header
  receipt +=
    "SN".padEnd(4) +
    "Item".padEnd(20) +
    "Qty".padEnd(6) +
    "Price".padEnd(10) +
    "Amt\n";
  receipt += "--------------------------------\n";

  // Items
  formData.items.forEach((item: any, index: number) => {
    const itemTotal = item.price * item.quantity;
    const sn = (index + 1).toString();
    const itemName =
      item.name.length > 18 ? item.name.substring(0, 15) + "..." : item.name;

    receipt +=
      sn.padEnd(4) +
      itemName.padEnd(20) +
      item.quantity.toString().padEnd(6) +
      `₹${item.price.toFixed(2)}`.padEnd(10) +
      `₹${itemTotal.toFixed(2)}\n`;
  });

  receipt += "--------------------------------\n";

  // Summary
  const totalQty = formData.items.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0
  );
  receipt +=
    `Subtotal`.padEnd(20) +
    totalQty.toString().padEnd(6) +
    `₹${subtotal.toFixed(2)}\n`;

  receipt += `IGST at 18%`.padEnd(20) + `₹${tax.toFixed(2)}\n`;

  receipt += "--------------------------------\n";
  receipt += `TOTAL`.padEnd(20) + `₹${total.toFixed(2)}\n`;
  receipt += "================================\n";

  if (formData.notes) {
    receipt += `Note: ${formData.notes}\n`;
    receipt += "--------------------------------\n";
  }

  receipt += "           Thank You!\n";
  receipt += "      Visit Again Soon!\n\n";

  return receipt;
};

export const printInvoice = (formData: any) => {
  console.log("formData", formData);
  const text = formatInvoiceForPrint(formData);
  const win = window.open("", "_blank", "width=320,height=600");
  if (!win) return;
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  win.document.write(`<!doctype html><html><head><title>Invoice</title>
    <style>
      body{
        margin:8px;
        font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size:12px;
        line-height:1.2;
        max-width:300px;
      } 
      pre{
        white-space:pre-wrap;
        margin:0;
        padding:0;
      }
      @media print {
        body { margin: 0; padding: 4px; }
        @page { margin: 0; size: 80mm 200mm; }
      }
    </style>
    </head><body><pre>${escaped}</pre><script>setTimeout(()=>window.print(),100);</script></body></html>`);
  win.document.close();
};

export const formatDateToDDMMYYYY = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
export const formatDateToDDMMYYYYHHMMAMPM = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours > 12 ? String(hours - 12) : hours;
  return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
};

export const formatDateToYYYYMMDD = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};
