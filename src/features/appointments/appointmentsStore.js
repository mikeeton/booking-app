// src/features/appointments/appointmentsStore.js
import { api } from "../../lib/api";

const KEY = "ba_appointments_v1";

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null") || [];
  } catch {
    return [];
  }
}
function writeCache(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
  return list;
}

// Synchronous getter for UI
export function getAppointments() {
  return readCache();
}

// Async fetch to refresh cache
export async function fetchAppointments() {
  const res = await api.get("/appointments/admin");
  const list = Array.isArray(res.data) ? res.data : (res.data?.appointments ?? []);
  writeCache(list);
  return list;
}

export async function deleteAppointment(id) {
  const res = await api.delete(`/appointments/admin/${id}`);
  const list = readCache().filter((a) => a.id !== id);
  writeCache(list);
  return res.data;
}

export async function createAppointment(payload) {
  const res = await api.post("/appointments", payload);
  const item = res.data.appointment ?? res.data;
  const list = [item, ...readCache()];
  writeCache(list);
  return item;
}

export async function updateAppointment(id, patch) {
  const res = await api.patch(`/appointments/admin/${id}`, patch);
  const item = res.data;
  const list = readCache().map((a) => (a.id === id ? item : a));
  writeCache(list);
  return item;
}

// Background refresh
fetchAppointments().catch(() => {});
