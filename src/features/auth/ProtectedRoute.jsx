// src/features/auth/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthed } from "./authStore";

export default function ProtectedRoute() {
  const location = useLocation();

  // Admin auth ONLY
  if (!isAuthed()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
