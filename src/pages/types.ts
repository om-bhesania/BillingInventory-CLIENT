export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "shopkeeper";
}
export interface LoginResponse {
  token: string;
  user: User;
}
