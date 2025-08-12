const baseUrl = import.meta.env.VITE_API_URL;

export const API_URL = {
  base: baseUrl,
  auth: {
    login: "/auth/login",
  },
  shop: {
    add: "/shops/add-shop",
    getAll: "/shops/get-all-shops",
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
};
