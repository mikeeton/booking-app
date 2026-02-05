// src/features/services/servicesStore.js
import { api } from "../../lib/api";

const KEY = "ba_services_v1";

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

function unwrapList(resData) {
  return Array.isArray(resData) ? resData : (resData?.services ?? []);
}

function toUI(s) {
  return {
    id: s.id,
    name: s.name,
    price: typeof s.price === "number" ? s.price : (Number(s.pricePence || 0) / 100),
    durationMins: Number(s.durationMins || 30),
    active: s.active ?? true,
  };
}

// Synchronous getter used throughout the UI (returns cached list)
export function getServices() {
  return readCache();
}

// Async: fetch latest services from API and update cache
export async function fetchServices() {
  const res = await api.get("/services");
  const list = unwrapList(res.data).map(toUI);
  writeCache(list);
  return list;
}

// Admin operations (keep same behaviour but update cache when possible)
export async function createService(form) {
  const payload = {
    name: form.name,
    durationMins: Number(form.durationMins || 30),
    pricePence: Math.round(Number(form.price || 0) * 100),
  };
  const res = await api.post("/services/admin", payload);
  const item = toUI(res.data);
  const list = [item, ...readCache()];
  writeCache(list);
  return item;
}

export async function updateService(id, form) {
  const patch = {
    name: form.name,
    durationMins: Number(form.durationMins || 30),
    pricePence: Math.round(Number(form.price || 0) * 100),
  };
  const res = await api.patch(`/services/admin/${id}`, patch);
  const item = toUI(res.data);
  const list = readCache().map((s) => (s.id === id ? item : s));
  writeCache(list);
  return item;
}

export async function deleteService(id) {
  const res = await api.delete(`/services/admin/${id}`);
  const list = readCache().filter((s) => s.id !== id);
  writeCache(list);
  return res.data;
}

// Kick off a background refresh when module loads
fetchServices().catch(() => {});
