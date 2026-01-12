// src/features/customers/customerAuthStore.js
import { findCustomerByEmail, createCustomer, updateCustomer, getCustomers } from "./customersStore";

const KEY = "booking_customer_auth_v1";

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { customerId: null };
  } catch {
    return { customerId: null };
  }
}
function setAuth(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
function clearAuth() {
  localStorage.removeItem(KEY);
}

async function hashPassword(pass) {
  if (!pass) return "";
  const enc = new TextEncoder().encode(pass);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normEmail(email) {
  return (email || "").trim().toLowerCase();
}

export async function registerCustomer({ name, email, phone, password }) {
  const e = normEmail(email);
  const existing = findCustomerByEmail(e);

  // ✅ If a record exists but has no passwordHash, it's a guest record.
  // Upgrade it instead of blocking sign up.
  if (existing) {
    if (existing.passwordHash) {
      throw new Error("Email already in use");
    }

    const hash = await hashPassword(password);
    updateCustomer(existing.id, {
      name: name?.trim() || existing.name,
      email: e,
      phone: phone?.trim() || existing.phone || "",
      passwordHash: hash,
      isGuest: false,
      lastLogin: new Date().toISOString(),
    });

    setAuth({ customerId: existing.id });
    return getCustomers().find((c) => c.id === existing.id) || existing;
  }

  // Normal new account
  const item = createCustomer({ name, email: e, phone });
  const hash = await hashPassword(password);
  updateCustomer(item.id, {
    passwordHash: hash,
    isGuest: false,
    lastLogin: new Date().toISOString(),
  });

  setAuth({ customerId: item.id });
  return item;
}

export async function loginCustomer(email, password) {
  const e = normEmail(email);
  const c = findCustomerByEmail(e);

  if (!c) throw new Error("No account for this email");

  // ✅ Clearer message when the record exists but was created as a guest
  if (!c.passwordHash) {
    throw new Error("Account not activated yet — please use Sign up to set a password.");
  }

  const hash = await hashPassword(password);
  if ((c.passwordHash || "") !== hash) throw new Error("Invalid credentials");

  updateCustomer(c.id, { lastLogin: new Date().toISOString() });
  setAuth({ customerId: c.id });
  return c;
}

export function logoutCustomer() {
  clearAuth();
  return { customerId: null };
}

export function getCurrentCustomer() {
  const { customerId } = getAuth();
  if (!customerId) return null;
  return getCustomers().find((c) => c.id === customerId) || null;
}

export function requestPasswordReset(email) {
  const e = normEmail(email);
  const c = findCustomerByEmail(e);
  if (!c) throw new Error("No account for this email");

  // If it's a guest with no password, force them to signup instead
  if (!c.passwordHash) {
    throw new Error("This email was used as a guest. Please Sign up to create a password first.");
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  updateCustomer(c.id, { resetCode: code, resetRequestedAt: new Date().toISOString() });
  return code;
}

export async function resetPassword(email, code, newPassword) {
  const e = normEmail(email);
  const c = findCustomerByEmail(e);
  if (!c) throw new Error("No account for this email");
  if (!c.resetCode || c.resetCode !== code) throw new Error("Invalid reset code");

  const hash = await hashPassword(newPassword);
  updateCustomer(c.id, { passwordHash: hash, resetCode: null, resetRequestedAt: null });
  return true;
}

export function getCustomerAuth() {
  return getAuth();
}
