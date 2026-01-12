const KEY = "ba_appointments_v1";
const uid = () => crypto.randomUUID?.() ?? String(Date.now() + Math.random());

function read(){ return JSON.parse(localStorage.getItem(KEY) || "[]"); }
function write(list){ localStorage.setItem(KEY, JSON.stringify(list)); return list; }

export function getAppointments(){ return read(); }

export function createAppointment(data){
  const list = read();

  const item = {
    id: uid(),
    customerId: data.customerId,
    serviceId: data.serviceId,
    startISO: data.startISO,   // ISO datetime
    endISO: data.endISO,       // ISO datetime
    note: data.note || "",
    status: data.status || "confirmed",
    createdAt: new Date().toISOString(),
  };

  list.unshift(item);
  write(list);
  return item;
}

export function updateAppointment(id, patch){
  const list = read().map(a => a.id === id ? { ...a, ...patch } : a);
  write(list);
}

export function deleteAppointment(id){
  const list = read().filter(a => a.id !== id);
  write(list);
}
