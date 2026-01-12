const KEY = "ba_services_v1";
const uid = () => crypto.randomUUID?.() ?? String(Date.now() + Math.random());

function read() { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
function write(list) { localStorage.setItem(KEY, JSON.stringify(list)); return list; }

export function getServices(){ return read(); }

export function createService(data){
  const list = read();
  const item = {
    id: uid(),
    name: data.name?.trim(),
    durationMins: Number(data.durationMins) || 30,
    price: Number(data.price) || 0,
    active: data.active ?? true,
    createdAt: new Date().toISOString(),
  };
  list.unshift(item);
  write(list);
  return item;
}

export function updateService(id, patch){
  const list = read().map(s => s.id === id ? { ...s, ...patch } : s);
  write(list);
}

export function deleteService(id){
  const list = read().filter(s => s.id !== id);
  write(list);
}
