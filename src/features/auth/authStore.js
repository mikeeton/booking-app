const KEY = "booking_admin_auth_v1";

export function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { isAuthed: false, user: null };
  } catch {
    return { isAuthed: false, user: null };
  }
}

export function setAuth(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}

// Demo login (replace with real API later)
export function isAuthed() {
  return !!getAuth()?.isAuthed;
}

export async function login(username, password) {
  // fake delay
  await new Promise((r) => setTimeout(r, 350));

  // Prefer environment-configured admin credentials (Vite: VITE_ADMIN_USER/PASS)
  const OK_USER = import.meta.env.VITE_ADMIN_USER ?? "admin";
  const OK_PASS = import.meta.env.VITE_ADMIN_PASS ?? "admin123";

  // In production, if admin creds are not explicitly set, disable demo login
  if (import.meta.env.PROD && !(import.meta.env.VITE_ADMIN_USER && import.meta.env.VITE_ADMIN_PASS)) {
    throw new Error("Admin login is disabled in production. Set VITE_ADMIN_USER and VITE_ADMIN_PASS.");
  }

  if (username === OK_USER && password === OK_PASS) {
    const payload = { isAuthed: true, user: { username } };
    setAuth(payload);
    return payload;
  }

  throw new Error("Invalid username or password");
}

export async function logout() {
  await new Promise((r) => setTimeout(r, 150));
  clearAuth();
  return { isAuthed: false, user: null };
}
