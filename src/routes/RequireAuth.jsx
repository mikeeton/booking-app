import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";

export default function RequireAuth({ children }) {
  const { isAuthed } = useAuth();
  const location = useLocation();

  if (!isAuthed) {
    // send them to login, but remember where they were trying to go
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
