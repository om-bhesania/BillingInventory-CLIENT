import { service } from "@/services/service";
import { API_URL } from "@/services/apiuri";

export type PingUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: string | null;
  roleId: string | null;
  publicId: string;
  permissions: { id: string; action: string; resource: string; description: string | null }[];
  managedShops: { id: string; name: string; email: string | null; location: string | null; contactNumber: string | null; isActive: boolean }[];
};

export type PingResponse = {
  tokenValidity: boolean;
  user?: PingUser;
};

export const pingUser = async (): Promise<PingResponse> => {
  return service<PingResponse>({ url: API_URL.ping.user, method: "GET" });
};


