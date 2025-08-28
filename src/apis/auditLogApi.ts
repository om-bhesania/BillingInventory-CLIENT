import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export interface AuditLogEntry {
  id: string;
  type: 'billing' | 'restock' | 'inventory' | 'user';
  action: string;
  details: string;
  amount?: number;
  shopName?: string;
  timestamp: string;
  status?: string;
}

export interface AuditLogResponse {
  entries: AuditLogEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AuditLogStats {
  total: {
    billings: number;
    restocks: number;
    inventoryUpdates: number;
  };
  recent: {
    billings: number;
    restocks: number;
    inventoryUpdates: number;
  };
  monthly: {
    billings: number;
    restocks: number;
    inventoryUpdates: number;
  };
}

export interface AuditLogStatsResponse {
  stats: AuditLogStats;
}

// Get audit log entries with pagination and filters
export const getAuditLog = async (params?: {
  page?: number;
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await service({
    url: API_URL.auditLog.list,
    method: "GET",
    query: params,
  });
  return response;
};

// Get audit log statistics
export const getAuditLogStats = async () => {
  const response = await service({
    url: API_URL.auditLog.stats,
    method: "GET",
  });
  return response;
};
