// src/routes/roleGuards.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthed as isAdminAuthed } from "../features/auth/authStore";
import { useCustomerAuth } from "../features/customers/CustomerAuthProvider";

/**
 * Admin-only guard
 * - If NOT admin authed => redirect to /login
 * - Customer login does NOT help here (hard block)
 */
export function RequireAdmin() {
  const loc = useLocation();
  const ok = isAdminAuthed();

  if (!ok) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return <Outlet />;
}

/**
 * Customer-only guard (optional)
 * - If NOT customer authed => redirect to /account
 */
export function RequireCustomer() {
  const loc = useLocation();
  const { current } = useCustomerAuth();

  const customer = (() => {
    try {
      return current?.() ?? null;
    } catch {
      return null;
    }
  })();

  if (!customer) {
    return <Navigate to="/account" replace state={{ from: loc.pathname }} />;
  }

  return <Outlet />;
}

/**
 * Convenience redirect:
 * - If already admin authed, keep them out of /login and push to /admin
 */
export function RedirectIfAdminAuthed({ to = "/admin" } = {}) {
  const ok = isAdminAuthed();
  if (ok) return <Navigate to={to} replace />;
  return <Outlet />;
}
