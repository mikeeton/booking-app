// src/features/auth/authStore.js
import { api, TOKENS } from "../../lib/api";

// ---- helpers ----
export function isAuthed() {
  return !!localStorage.getItem(TOKENS.admin);
}

export function getAdminToken() {
  return localStorage.getItem(TOKENS.admin);
}

// ---- ADMIN AUTH ----
export async function loginAdmin(email, password) {
  const res = await api.post("/auth/admin/login", { email, password });
  localStorage.setItem(TOKENS.admin, res.data.token);

  // ensure customer token is cleared
  localStorage.removeItem(TOKENS.customer);

  return res.data.admin;
}

export function logoutAdmin() {
  localStorage.removeItem(TOKENS.admin);
}

// ---- CUSTOMER AUTH (if needed later) ----
export async function loginCustomer(email, password) {
  const res = await api.post("/auth/customer/login", { email, password });
  localStorage.setItem(TOKENS.customer, res.data.token);
  localStorage.removeItem(TOKENS.admin);
  return res.data.customer;
}

// ---- COMMON ----
export async function getMe() {
  const res = await api.get("/auth/me");
  return res.data;
}

// ---- ALIASES FOR UI (THIS FIXES YOUR ERROR) ----

// Many components expect generic names:
export const login = loginAdmin;
export const logout = logoutAdmin;

// Used in AdminLayout earlier
export function clearAuth() {
  localStorage.removeItem(TOKENS.admin);
  localStorage.removeItem(TOKENS.customer);
}
// ---- GENERIC AUTH HELPERS (FOR AuthProvider.jsx) ----

export function getAuth() {
  const adminToken = localStorage.getItem(TOKENS.admin);
  const customerToken = localStorage.getItem(TOKENS.customer);

  if (adminToken) {
    return { authed: true, role: "admin" };
  }

  if (customerToken) {
    return { authed: true, role: "customer" };
  }

  return { authed: false, role: null };
}
