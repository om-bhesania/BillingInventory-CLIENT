import { Navigate, Outlet } from "react-router-dom";
import useSessionStorage from "@/hooks/use-sessionStorage";

const ProtectedRoute = () => {
  const token = useSessionStorage("auth_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
