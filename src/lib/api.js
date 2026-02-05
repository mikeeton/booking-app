// src/lib/api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// token helpers
export const TOKENS = {
  admin: "ba_admin_token",
  customer: "ba_customer_token",
};

api.interceptors.request.use((config) => {
  // Prefer admin token if present, else customer
  const adminToken = localStorage.getItem(TOKENS.admin);
  const customerToken = localStorage.getItem(TOKENS.customer);

  const token = adminToken || customerToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
