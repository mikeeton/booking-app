// src/api/customers.js
const KEY = "bookingapp_customers_v1";

function read() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

function write(customers) {
  localStorage.setItem(KEY, JSON.stringify(customers));
}

function id() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

export function getCustomers() {
  return read();
}

export function createCustomer(payload) {
  const customers = read();
  const newCustomer = {
    id: id(),
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    email: payload.email.trim(),
    notes: payload.notes?.trim() || "",
    createdAt: new Date().toISOString(),
  };
  customers.unshift(newCustomer);
  write(customers);
  return newCustomer;
}

export function updateCustomer(customerId, payload) {
  const customers = read();
  const idx = customers.findIndex((c) => c.id === customerId);
  if (idx === -1) throw new Error("Customer not found");

  customers[idx] = {
    ...customers[idx],
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    email: payload.email.trim(),
    notes: payload.notes?.trim() || "",
    updatedAt: new Date().toISOString(),
  };

  write(customers);
  return customers[idx];
}

export function deleteCustomer(customerId) {
  const customers = read().filter((c) => c.id !== customerId);
  write(customers);
  return true;
}
