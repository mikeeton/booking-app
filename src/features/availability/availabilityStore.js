import { api } from "../../lib/api";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const DEFAULT_DAY = { enabled: false, start: "09:00", end: "17:00", breaks: [] };
const KEY = "ba_availability_v1";

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null") || null;
  } catch {
    return null;
  }
}
function writeCache(v) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
  return v;
}

function toObj(byDay) {
  if (byDay && !Array.isArray(byDay) && typeof byDay === "object") return byDay;
  const arr = Array.isArray(byDay) ? byDay : [];
  const obj = {};
  DAY_KEYS.forEach((k, i) => {
    obj[k] = arr[i] ?? { ...DEFAULT_DAY };
  });
  return obj;
}

function toArray(byDay) {
  if (Array.isArray(byDay)) return byDay;
  return DAY_KEYS.map((k) => byDay?.[k] ?? { ...DEFAULT_DAY });
}

export async function fetchAvailability() {
  const res = await api.get("/availability");
  const data = res.data?.availability ?? res.data;
  const norm = { ...data, byDay: toObj(data?.byDay) };
  writeCache(norm);
  return norm;
}

export async function adminSaveAvailability(payload) {
  const toSend = { ...payload, byDay: toArray(payload?.byDay) };
  const res = await api.put("/availability/admin", toSend);
  const data = res.data?.availability ?? res.data;
  const norm = { ...data, byDay: toObj(data?.byDay) };
  writeCache(norm);
  return norm;
}

export function getAvailability() {
  const cached = readCache();
  if (cached) return cached;
  const defaultWeek = {};
  DAY_KEYS.forEach((k) => (defaultWeek[k] = { ...DEFAULT_DAY }));
  const def = { slotStepMins: 15, byDay: defaultWeek };
  writeCache(def);
  return def;
}

export const saveAvailability = adminSaveAvailability;
export const updateAvailability = adminSaveAvailability;

// Kick off background refresh
fetchAvailability().catch(() => {});
