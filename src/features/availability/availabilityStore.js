const KEY = "booking_availability_v1";

const DEFAULT = {
  slotStepMins: 15,
  week: {
    mon: { enabled: true,  start: "09:00", end: "17:00", breaks: [{ start: "12:00", end: "13:00" }] },
    tue: { enabled: true,  start: "09:00", end: "17:00", breaks: [{ start: "12:00", end: "13:00" }] },
    wed: { enabled: true,  start: "09:00", end: "17:00", breaks: [{ start: "12:00", end: "13:00" }] },
    thu: { enabled: true,  start: "09:00", end: "17:00", breaks: [{ start: "12:00", end: "13:00" }] },
    fri: { enabled: true,  start: "09:00", end: "17:00", breaks: [{ start: "12:00", end: "13:00" }] },
    sat: { enabled: false, start: "10:00", end: "14:00", breaks: [] },
    sun: { enabled: false, start: "10:00", end: "14:00", breaks: [] },
  },
};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : DEFAULT;
  } catch {
    return DEFAULT;
  }
}
function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getAvailability() {
  return read();
}
export function updateAvailability(patch) {
  const cur = read();
  const next = { ...cur, ...patch };
  write(next);
  return next;
}
export function saveAvailability(data) {
  write(data);
  return data;
}
export function updateDay(dayKey, patch) {
  const cur = read();
  const next = {
    ...cur,
    week: {
      ...cur.week,
      [dayKey]: { ...cur.week[dayKey], ...patch },
    },
  };
  write(next);
  return next;
}
