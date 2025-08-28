const baseUrl = import.meta.env.VITE_API_URL;

export const API_URL = {
  base: baseUrl,
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
  },
  ping: {
    user: "/ping/user",
  },
  notifications: {
    list: "/notifications",
    read: (id: string) => `/notifications/read/${id}`,
    readAll: "/notifications/read-all",
    create: "/notifications/create",
    stream: "/notifications/stream",
    clear: (id: string) => `/notifications/clear/${id}`,
    clearAll: "/notifications/clear-all",
  },
  shop: {
    add: "/shops/add-shop",
    getAll: "/shops/get-all-shops",
    byId: (id: string) => `/shops/${id}`,
  },
  shopInventory: {
    create: "/shop-inventory",
    getByShopId: (shopId: string) => `/shop-inventory/${shopId}`,
    updateStock: (id: string) => `/shop-inventory/${id}/stock`,
    remove: (id: string) => `/shop-inventory/${id}`,
  },
  restockRequest: {
    create: "/restock-requests",
    getByShopId: (shopId: string) => `/restock-requests/${shopId}`,
    getAll: "/restock-requests", // Admin: Get all restock requests (new)
    approve: (id: string) => `/restock-requests/${id}/approve`,
    reject: (id: string) => `/restock-requests/${id}/reject`,
    updateStatus: (id: string) => `/restock-requests/${id}/status`, // New
    markFulfilled: "/restock-requests/fulfill", // New
    hide: (id: string) => `/restock-requests/${id}`, // New: Hide request (soft delete)
  },
  products: {
    getAll: "/products/get-products",
    getById: (id: string) => `/products/${id}`,
    create: "/products/add-products",
    update: (id: string) => `/products/${id}`,
    delete: (id: string) => `/products/${id}`,
  },
  packagingTypes: {
    list: "/packaging-types",
    create: "/packaging-types",
    update: (id: string) => `/packaging-types/${id}`,
    delete: (id: string) => `/packaging-types/${id}`,
  },
  employee: {
    getAll: "/auth/users",
  },
  role: {
    add: "/role/add",
    getAll: "/roles/getall",
  },
  rolesAndPerms: {
    getRole: "/auth/roles",
  },
  dashboard: {
    metrics: "/dashboard/metrics",
    activities: "/dashboard/activities",
    refresh: "/dashboard/refresh",
    charts: "/dashboard/charts",
    enhanced: "/dashboard/enhanced",
    realtime: "/dashboard/realtime",
  },
  auditLog: {
    list: "/audit-log",
    stats: "/audit-log/stats",
  },
  lowStock: {
    list: "/low-stock",
    stats: "/low-stock/stats",
    filters: "/low-stock/filters",
  },
  billing: {
    create: "/billing",
    byShopId: (shopId: string) => `/billing/${shopId}`,
    byId: (id: string) => `/billing/billing/${id}`,
    updatePaymentStatus: (id: string) => `/billing/billing/${id}/payment-status`,
    stats: (shopId: string) => `/billing/${shopId}/stats`,
  },
};
