import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCurrentCustomer } from "./customerAuthStore";

export default function CustomerProtectedRoute() {
  const location = useLocation();
  const customer = getCurrentCustomer();

  if (!customer) {
    return <Navigate to="/account" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
