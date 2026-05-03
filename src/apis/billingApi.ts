import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export interface BillingItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Billing {
  id: string;
  shopId: string | null;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
  items: BillingItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentStatus: "pending" | "paid" | "failed";
  invoiceNumber?: string;
  invoiceType?: string;
  createdAt: string;
  updatedAt: string;
  shop: {
    id: string;
    name: string;
    address?: string | null;
    contactNumber?: string | null;
  } | null;
}

export interface CreateBillingRequest {
  shopId?: string;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
  items: Omit<BillingItem, "total">[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
}

export interface UpdatePaymentStatusRequest {
  paymentStatus: "pending" | "paid" | "failed";
}

export interface BillingStats {
  totalBillings: number;
  totalRevenue: number;
  byStatus: {
    [key: string]: {
      count: number;
      total: number;
    };
  };
}

// Create billing
export const createBilling = async (data: CreateBillingRequest): Promise<Billing> => {
  return service<Billing>({ url: API_URL.billing.create, method: "POST", data });
};

// Get billings by shop ID
export const getBillings = async (shopId: string): Promise<Billing[]> => {
  return service<Billing[]>({ url: API_URL.billing.byShopId(shopId), method: "GET" });
};

// Get billing by ID
export const getBillingById = async (id: string): Promise<Billing> => {
  return service<Billing>({ url: API_URL.billing.byId(id), method: "GET" });
};

// Update billing payment status
export const updateBillingPaymentStatus = async (id: string, data: UpdatePaymentStatusRequest): Promise<Billing> => {
  return service<Billing>({ url: API_URL.billing.updatePaymentStatus(id), method: "PATCH", data });
};

// Get billing statistics for a shop
export const getBillingStats = async (shopId: string): Promise<BillingStats> => {
  return service<BillingStats>({ url: API_URL.billing.stats(shopId), method: "GET" });
};

// Get next invoice number (max BLIZZ/YYYY/* in DB + 1; matches server create rule)
export const getNextInvoiceNumber = async (): Promise<{ invoiceNumber: string }> => {
  return service<{ invoiceNumber: string }>({
    url: API_URL.billing.nextInvoiceNumber,
    method: "GET",
  });
};