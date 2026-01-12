export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function uid(prefix = "id") {
  return `${prefix}_${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2)}`;
}
