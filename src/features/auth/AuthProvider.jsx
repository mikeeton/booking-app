import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAuth, login as doLogin, logout as doLogout } from "./authStore";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuthState] = useState(() => getAuth());
  const [loading, setLoading] = useState(false);

  // Keep state in sync if localStorage changes (multiple tabs)
  useEffect(() => {
    function onStorage(e) {
      if (e.key) setAuthState(getAuth());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function login(username, password) {
    setLoading(true);
    try {
      const res = await doLogin(username, password);
      setAuthState(res);
      return res;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      const res = await doLogout();
      setAuthState(res);
      return res;
    } finally {
      setLoading(false);
    }
  }

  const value = useMemo(
    () => ({ auth, isAuthed: !!auth?.isAuthed, user: auth?.user, loading, login, logout }),
    [auth, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
