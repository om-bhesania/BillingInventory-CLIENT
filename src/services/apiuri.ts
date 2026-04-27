const baseUrl =
  "https://kt43kr00-5001.inc1.devtunnels.ms/"
export const API_URL = {
  base: baseUrl,
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    userPerms: "/auth/user-perms",
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
    linkManager: (id: string) => `/shops/${id}/link-manager`,
    unlinkManager: (id: string) => `/shops/${id}/unlink-manager`,
    deleteAllData: (id: string) => `/shops/${id}/delete-all-data`,
  },
  shopInventory: {
    create: "/shop-inventory",
    getByShopId: (shopId: string) => `/shop-inventory/${shopId}`,
    getById: (id: string) => `/shop-inventory/item/${id}`,
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
    getAll: "/employees",
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
    updatePaymentStatus: (id: string) =>
      `/billing/billing/${id}/payment-status`,
    stats: (shopId: string) => `/billing/${shopId}/stats`,
  },
  chat: {
    messages: (room: string) => `/chat/messages/${room}`,
    send: "/chat/send",
    rooms: "/chat/rooms",
    read: (room: string) => `/chat/read/${room}`,
    unreadCount: "/chat/unread-count",
  },
  chatRequests: {
    create: "/chat-requests",
    list: "/chat-requests",
    details: "/chat-requests",
    assign: "/chat-requests",
    close: "/chat-requests",
    delete: "/chat-requests",
  },
  stockAdjustments: {
    create: "/stock-adjustments",
    list: "/stock-adjustments",
    details: "/stock-adjustments",
    updateStatus: "/stock-adjustments",
    defaultReasons: "/stock-adjustments/reasons/default",
  },
  payments: {
    uploadReceipt: "/payments/receipt",
    verifyPayment: "/payments/verify",
    getPaymentDetails: "/payments",
  },
  suppliers: {
    create: "/suppliers",
    getAll: "/suppliers",
    getById: (id: string) => `/suppliers/${id}`,
    update: (id: string) => `/suppliers/${id}`,
    delete: (id: string) => `/suppliers/${id}`,
  },
  rawMaterials: {
    create: "/raw-materials",
    getAll: "/raw-materials",
    getById: (id: string) => `/raw-materials/${id}`,
    update: (id: string) => `/raw-materials/${id}`,
    delete: (id: string) => `/raw-materials/${id}`,
  },
  rawMaterialInventory: {
    getAll: "/raw-material-inventory",
    getLowStock: "/raw-material-inventory/low-stock",
    getById: (id: string) => `/raw-material-inventory/${id}`,
    initialize: "/raw-material-inventory",
    update: (id: string) => `/raw-material-inventory/${id}`,
  },
  recipes: {
    create: "/recipes",
    getAll: "/recipes",
    getByProduct: (productId: string) => `/recipes/product/${productId}`,
    getById: (id: string) => `/recipes/${id}`,
    update: (id: string) => `/recipes/${id}`,
    delete: (id: string) => `/recipes/${id}`,
    setDefault: (id: string) => `/recipes/${id}/set-default`,
  },
  production: {
    create: "/production",
    getAll: "/production",
    getById: (id: string) => `/production/${id}`,
    getByProduct: (productId: string) => `/production/product/${productId}`,
  },
};
