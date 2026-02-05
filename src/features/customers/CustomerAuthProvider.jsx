// src/features/customers/CustomerAuthProvider.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  getCurrentCustomer,
  requestPasswordReset,
  resetPassword,
  getCustomerAuth,
} from "./customerAuthStore";

const Ctx = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => getCustomerAuth());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onStorage() {
      setAuthState(getCustomerAuth());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function login(email, password) {
    setLoading(true);
    try {
      const c = await loginCustomer(email, password);
      setAuthState(getCustomerAuth());
      return c;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    try {
      const c = await registerCustomer(payload);
      setAuthState(getCustomerAuth());
      return c;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    const res = logoutCustomer();
    setAuthState(res);
    return res;
  }

  function current() {
    return getCurrentCustomer();
  }

  function requestReset(email) {
    return requestPasswordReset(email);
  }

  async function doReset(email, code, newPass) {
    setLoading(true);
    try {
      return await resetPassword(email, code, newPass);
    } finally {
      setLoading(false);
    }
  }

  const value = useMemo(
    () => ({ authState, loading, login, logout, register, current, requestReset, doReset }),
    [authState, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCustomerAuth must be used inside <CustomerAuthProvider />");
  return ctx;
}
