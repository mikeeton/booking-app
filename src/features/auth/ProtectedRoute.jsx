import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthed } from "./authStore";

export default function ProtectedRoute() {
  const location = useLocation();

  if (!isAuthed()) {
    // ✅ pass full location so Login can redirect back correctly
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
