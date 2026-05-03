import { Button } from "@/components/ui/button";
import { clsx, type ClassValue } from "clsx";
import { Plus, Trash2 } from "lucide-react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
export const printInvoice = (formData: any) => {
  const items = (formData?.items || []).map((item: any) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
    return {
      name: item.name || "Item",
      quantity,
      unitPrice,
      amount: quantity * unitPrice,
    };
  });

  const subtotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
  const tax = Number(formData?.tax ?? subtotal * 0.18);
  const discount = Number(formData?.discount ?? 0);
  const total = Number(formData?.total ?? subtotal + tax - discount);
  const totalItems = items.reduce(
    (sum: number, item: any) => sum + Number(item.quantity || 0),
    0
  );

  const invoiceNumber = escapeHtml(
    formData?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`
  );
  const invoiceDate = formData?.invoiceDate
    ? new Date(formData.invoiceDate)
    : new Date();
  const formattedDate = invoiceDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const brandTitle = "BLIZZ";
  const outletRaw =
    (formData?.shopName || formData?.shop || "").trim() || "";
  const outletLine = outletRaw
    ? `<div class="center outlet-sub">${escapeHtml(outletRaw)}</div>`
    : "";
  const shopAddress = escapeHtml(
    formData?.shopAddress || "Shop address not available"
  );
  const shopContact = escapeHtml(formData?.shopContact || "");
  const customerName = escapeHtml(
    formData?.customerName || formData?.customer || "Guest"
  );
  const customerContact = escapeHtml(
    formData?.customerContact || formData?.contactNumber || ""
  );
  const notes = escapeHtml(formData?.notes || "");

  const itemRows = items
    .map(
      (item: any) => `
        <tr>
          <td>
            <div class="item-name">${escapeHtml(item.name)}</div>
            <div class="item-meta">${item.quantity} x ${item.unitPrice.toFixed(2)}</div>
          </td>
          <td class="amount">${item.amount.toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  const win = window.open("", "_blank", "width=420,height=760");
  if (!win) return;

  win.document.write(`<!doctype html><html><head><title>Invoice</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        font-family: "Courier New", monospace;
        font-size: 12px;
        color: #000;
      }
      .receipt {
        width: 76.2mm;
        max-width: 76.2mm;
        padding: 3mm;
      }
      .center { text-align: center; }
      .line { border-top: 1px dashed #000; margin: 6px 0; }
      .brand-title { font-weight: 700; font-size: 20px; letter-spacing: 0.02em; }
      .outlet-sub { font-size: 11px; font-weight: 500; opacity: 0.88; margin-top: 2px; }
      .muted { opacity: 0.9; }
      .heading { font-weight: 700; margin-bottom: 2px; }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin: 2px 0;
      }
      .row strong { font-size: 14px; }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      td {
        vertical-align: top;
        padding: 2px 0;
      }
      .amount {
        text-align: right;
        white-space: nowrap;
        padding-left: 8px;
      }
      .item-name { font-weight: 600; }
      .item-meta { font-size: 11px; }
      .footer {
        text-align: center;
        font-weight: 700;
        margin-top: 8px;
      }
      @media print {
        @page { size: 76.2mm auto; margin: 0; }
        body { width: 76.2mm; }
        .receipt { width: 76.2mm; }
      }
    </style>
    </head>
    <body>
      <div class="receipt">
        <div class="center brand-title">${brandTitle}</div>
        ${outletLine}
        <div class="center muted">${shopAddress}</div>
        ${shopContact ? `<div class="center muted">Tel: ${shopContact}</div>` : ""}
        <div class="line"></div>

        <div class="row"><span class="heading">Receipt #</span><span>${invoiceNumber}</span></div>
        <div class="row"><span>Date</span><span>${formattedDate}</span></div>
        <div class="row"><span>Customer</span><span>${customerName}</span></div>
        ${customerContact ? `<div class="row"><span>Phone</span><span>${customerContact}</span></div>` : ""}
        <div class="line"></div>

        <div class="row"><span class="heading">ITEMS (${totalItems})</span><span></span></div>
        <table>${itemRows}</table>
        <div class="line"></div>

        <div class="row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        <div class="row"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
        ${discount > 0 ? `<div class="row"><span>Discount</span><span>- ${discount.toFixed(2)}</span></div>` : ""}
        <div class="row"><strong>TOTAL</strong><strong>${total.toFixed(2)}</strong></div>
        ${notes ? `<div class="line"></div><div class="muted">Note: ${notes}</div>` : ""}

        <div class="footer">THANK YOU FOR VISITING BLIZZ</div>
      </div>
      <script>setTimeout(() => window.print(), 100);</script>
    </body></html>`);
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
