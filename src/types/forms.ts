
export interface LoginFormValues {
  email: string;
  password: string;
}

export interface InventoryFormValues {
  name: string;
  category: string;
  quantity: number;
  price: number;
  reorderPoint?: number;
  shop: string;
  description?: string;
}

export interface ShopFormValues {
  name: string;
  location: string;
  manager: string;
  contact: string;
  email?: string;
  openingTime?: string;
  closingTime?: string;
  description?: string;
}

export interface EmployeeFormValues {
  name: string;
  email: string;
  phone: string;
  position: string;
  shop: string;
  joinDate?: string;
  address?: string;
  isAdmin: boolean;
}

export interface InvoiceFormValues {
  customer: string;
  contactNumber?: string;
  shop: string;
  invoiceDate: string;
  items: InvoiceItemValues[];
  notes?: string;
}

export interface InvoiceItemValues {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}
