import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

// Email notification types
export interface LowStockAlertData {
  productId: string;
  shopId: string;
  currentStock: number;
  minStock: number;
}

export interface EmployeeCreatedData {
  employeeId: string;
  password: string;
}

export interface RestockRequestData {
  requestId: string;
}

export interface InvoiceGeneratedData {
  invoiceId: string;
  customerEmail: string;
}

export interface SystemNotificationData {
  title: string;
  message: string;
  recipients: string[];
  actionUrl?: string;
}

export interface TestEmailData {
  testEmail: string;
}

// Email API functions
export const sendLowStockAlert = async (data: LowStockAlertData) => {
  const response = await service({
    url: `${API_URL.base}/email/low-stock-alert`,
    method: "POST",
    data,
  });
  return response;
};

export const sendEmployeeCreatedEmail = async (data: EmployeeCreatedData) => {
  const response = await service({
    url: `${API_URL.base}/email/employee-created`,
    method: "POST",
    data,
  });
  return response;
};

export const sendRestockRequestEmail = async (data: RestockRequestData) => {
  const response = await service({
    url: `${API_URL.base}/email/restock-request`,
    method: "POST",
    data,
  });
  return response;
};

export const sendInvoiceGeneratedEmail = async (data: InvoiceGeneratedData) => {
  const response = await service({
    url: `${API_URL.base}/email/invoice-generated`,
    method: "POST",
    data,
  });
  return response;
};

export const sendSystemNotificationEmail = async (data: SystemNotificationData) => {
  const response = await service({
    url: `${API_URL.base}/email/system-notification`,
    method: "POST",
    data,
  });
  return response;
};

export const testEmailConfiguration = async (data: TestEmailData) => {
  const response = await service({
    url: `${API_URL.base}/email/test`,
    method: "POST",
    data,
  });
  return response;
};

export const getEmailTemplates = async () => {
  const response = await service({
    url: `${API_URL.base}/email/templates`,
    method: "GET",
  });
  return response;
};

// Email template types
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailTemplates {
  lowStockAlert: EmailTemplate;
  employeeCreated: EmailTemplate;
  restockRequest: EmailTemplate;
  invoiceGenerated: EmailTemplate;
  systemNotification: EmailTemplate;
}
