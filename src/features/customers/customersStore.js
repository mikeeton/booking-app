const KEY = "ba_customers_v1";
const uid = () => crypto.randomUUID?.() ?? String(Date.now() + Math.random());

function read() {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}
function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export function getCustomers() {
  return read();
}

export function createCustomer(data) {
  const list = read();
  const item = {
    id: uid(),
    name: data.name?.trim(),
    email: data.email?.trim() || "",
    phone: data.phone?.trim() || "",
    createdAt: new Date().toISOString(),
  };
  list.unshift(item);
  write(list);
  return item;
}

export function updateCustomer(id, patch) {
  const list = read().map((c) => (c.id === id ? { ...c, ...patch } : c));
  write(list);
}

export function deleteCustomer(id) {
  const list = read().filter((c) => c.id !== id);
  write(list);
}

export function findCustomerByEmail(email) {
  const e = (email || "").trim().toLowerCase();
  return read().find((c) => (c.email || "").toLowerCase() === e);
}
