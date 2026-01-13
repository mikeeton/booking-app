// src/features/customers/CustomerProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCustomerAuth } from "./CustomerAuthProvider";

export default function CustomerProtectedRoute() {
  const { current } = useCustomerAuth();
  const location = useLocation();

  const customer = (() => {
    try {
      return current?.() ?? null;
    } catch {
      return null;
    }
  })();

  // Not signed in as customer → send to /account
  if (!customer) {
    return <Navigate to="/account" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
