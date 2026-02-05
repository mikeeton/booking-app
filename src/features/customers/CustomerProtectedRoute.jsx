// src/features/customers/CustomerProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCustomerAuth } from "./customerAuthStore";

export default function CustomerProtectedRoute() {
  const loc = useLocation();
  const s = getCustomerAuth();

  if (!s?.ok) {
    return <Navigate to="/account" replace state={{ from: loc.pathname }} />;
  }

  return <Outlet />;
}
