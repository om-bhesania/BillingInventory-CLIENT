import { Button } from "@/components/ui/button";
import { clsx, type ClassValue } from "clsx";
import { Plus, Trash2 } from "lucide-react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const formatInvoiceForPrint = (formData: any) => {
  let receipt = "       \u{1F366} Blizz \u{1F366}\n";
  receipt += "--------------------------------\n";
  receipt += `Customer: ${formData.customer}\n`;
  if (formData.contactNumber) {
    receipt += `Phone: ${formData.contactNumber}\n`;
  }
  receipt += `Shop: ${formData.shop}\n`;
  receipt += `Date: ${formData.invoiceDate}\n`;
  receipt += "--------------------------------\n";

  formData.items.forEach((item: any) => {
    receipt += `${item.name}\n  x${item.quantity}   \u{20B9}${
      item.price * item.quantity
    }\n`;
  });

  receipt += "--------------------------------\n";
  receipt += `Subtotal: \u{20B9}${formData.items
    .reduce((t: number, i: any) => t + i.price * i.quantity, 0)
    .toFixed(2)}\n`;
  receipt += `GST (18%): \u{20B9}${(
    formData.items.reduce((t: number, i: any) => t + i.price * i.quantity, 0) *
    0.18
  ).toFixed(2)}\n`;
  receipt += `TOTAL: \u{20B9}${(
    formData.items.reduce((t: number, i: any) => t + i.price * i.quantity, 0) *
    1.18
  ).toFixed(2)}\n`;

  if (formData.notes) {
    receipt += `Note: ${formData.notes}\n`;
  }

  receipt += "--------------------------------\n";
  receipt += "  Thank you! Visit Again \u{1F64F}\n\n\n";
  return receipt;
};

export const printInvoice = (formData: any) => {
  const text = formatInvoiceForPrint(formData);
  const win = window.open("", "_blank", "width=480,height=640");
  if (!win) return;
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  win.document.write(`<!doctype html><html><head><title>Invoice</title>
    <style>body{margin:16px;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;} pre{white-space:pre-wrap;}</style>
    </head><body><pre>${escaped}</pre><script>setTimeout(()=>window.print(),100);</script></body></html>`);
  win.document.close();
};

 

