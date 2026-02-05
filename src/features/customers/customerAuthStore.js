// src/features/customers/customerAuthStore.js
import { api, TOKENS } from "../../lib/api";

const KEY_STATE = "ba_customer_state_v1";

function writeState(s) {
  localStorage.setItem(KEY_STATE, JSON.stringify(s));
  return s;
}
function readState() {
  try { return JSON.parse(localStorage.getItem(KEY_STATE) || "null"); } catch { return null; }
}

export function getCustomerAuth() {
  return readState() || { ok: !!localStorage.getItem(TOKENS.customer) };
}

export async function loginCustomer(email, password) {
  const res = await api.post("/auth/customer/login", { email, password });
  localStorage.setItem(TOKENS.customer, res.data.token);
  // ensure admin token is cleared when customer logs in
  localStorage.removeItem(TOKENS.admin);
  writeState({ ok: true, customer: res.data.customer });
  return res.data.customer;
}

export async function registerCustomer(payload) {
  const res = await api.post("/auth/customer/register", payload);
  localStorage.setItem(TOKENS.customer, res.data.token);
  localStorage.removeItem(TOKENS.admin);
  writeState({ ok: true, customer: res.data.customer });
  return res.data.customer;
}

export function logoutCustomer() {
  localStorage.removeItem(TOKENS.customer);
  const s = { ok: false, customer: null };
  writeState(s);
  return s;
}

export function getCurrentCustomer() {
  const s = readState();
  return s?.customer || null;
}

// (optional later) reset flow can be API-based; for now keep stubs
export function requestPasswordReset() {
  throw new Error("Reset flow not wired yet (next step).");
}
export async function resetPassword() {
  throw new Error("Reset flow not wired yet (next step).");
}
