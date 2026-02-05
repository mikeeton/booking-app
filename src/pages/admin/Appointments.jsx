// src/pages/admin/Appointments.jsx
import { useMemo, useState, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import "../../components/ui/ui.css";

import { getCustomers } from "../../features/customers/customersStore";
import { getServices } from "../../features/services/servicesStore";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../../features/appointments/appointmentsStore";

// --- Date helpers ---
function toISO(date, time) {
  return new Date(`${date}T${time}:00`).toISOString();
}
function addMins(iso, mins) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}
function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
function dayISO(d) {
  return d.toISOString().slice(0, 10);
}
function shortDay(d) {
  return d.toLocaleDateString([], { weekday: "short" });
}
function shortMD(d) {
  return d.toLocaleDateString([], { month: "short", day: "2-digit" });
}

export default function Appointments() {
  const [mode, setMode] = useState("week"); // week | list
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Customers are currently localStorage-based (sync)
  const customers = getCustomers();

  // Services + appointments are API-based (async)
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [svc, appt] = await Promise.all([getServices(), getAppointments()]);
      setServices(svc);
      setAppointments(appt);
    } catch (e) {
      console.error("Failed to load appointments/services:", e);
      alert("Failed to load data. Make sure you're logged in as admin and the API is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const customerMap = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c])),
    [customers]
  );
  const serviceMap = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s])),
    [services]
  );

  const [form, setForm] = useState({
    customerId: "",
    serviceId: "",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    endISO: "",
    note: "",
    status: "confirmed",
  });

  function recomputeEnd(next) {
    const svc = serviceMap[next.serviceId];
    if (!svc) return { ...next, endISO: "" };
    const startISO = toISO(next.date, next.time);
    const endISO = addMins(startISO, Number(svc.durationMins) || 30);
    return { ...next, endISO };
  }

  function openNew() {
    setEditing(null);
    const today = new Date().toISOString().slice(0, 10);
    const base = {
      customerId: "",
      serviceId: "",
      date: today,
      time: "10:00",
      endISO: "",
      note: "",
      status: "confirmed",
    };
    setForm(base);
    setOpen(true);
  }

  function openEdit(a) {
    setEditing(a);
    const start = new Date(a.startISO);
    const date = start.toISOString().slice(0, 10);
    const time = start.toTimeString().slice(0, 5);
    setForm({
      customerId: a.customerId,
      serviceId: a.serviceId,
      date,
      time,
      endISO: a.endISO,
      note: a.note || "",
      status: a.status || "confirmed",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.customerId) return alert("Choose a customer");
    if (!form.serviceId) return alert("Choose a service");

    const startISO = toISO(form.date, form.time);
    const svc = serviceMap[form.serviceId];
    const endISO = addMins(startISO, Number(svc?.durationMins) || 30);

    const payload = {
      customerId: form.customerId,
      serviceId: form.serviceId,
      startISO,
      endISO,
      note: form.note,
      status: form.status,
    };

    try {
      if (editing) await updateAppointment(editing.id, payload);
      else await createAppointment(payload);

      setOpen(false);
      await refresh();
    } catch (e) {
      console.error("Save failed:", e);
      alert("Could not save appointment. (Admin create/update may not be enabled on backend yet.)");
    }
  }

  async function remove(id) {
    if (!confirm("Delete this appointment?")) return;

    try {
      await deleteAppointment(id);
      await refresh();
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Could not delete appointment.");
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return appointments;

    return appointments.filter((a) => {
      const c = customerMap[a.customerId];
      const s = serviceMap[a.serviceId];
      return (
        (c?.name || "").toLowerCase().includes(q) ||
        (s?.name || "").toLowerCase().includes(q) ||
        (a.status || "").toLowerCase().includes(q)
      );
    });
  }, [appointments, query, customerMap, serviceMap]);

  // --------- Week view data ---------
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = useMemo(() => {
    const now = new Date();
    const base = new Date(now);
    base.setDate(base.getDate() + weekOffset * 7);

    // shift to Monday
    const day = base.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMon);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const weekStart = dayISO(weekDays[0]);
  const weekEnd = dayISO(weekDays[6]);

  const weekAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const date = new Date(a.startISO).toISOString().slice(0, 10);
      return date >= weekStart && date <= weekEnd;
    });
  }, [appointments, weekStart, weekEnd]);

  if (loading) {
    return (
      <div className="uiPage">
        <div className="uiCard uiCardPad">Loading appointments…</div>
      </div>
    );
  }

  return (
    <div className="uiPage">
      <div className="uiCard uiCardPad">
        <div className="uiHeader">
          <div>
            <div className="uiTitle">Appointments</div>
            <div className="uiSubtitle">Manage bookings + switch between list and week view.</div>
          </div>

          <div className="uiToolbar">
            <input
              className="uiInput"
              placeholder="Search appointments…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <select
              className="uiSelect"
              style={{ minWidth: 160 }}
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="week">Week view</option>
              <option value="list">List view</option>
            </select>

            <button type="button" className="uiBtn uiBtnPrimary" onClick={openNew}>
              + New
            </button>
          </div>
        </div>
      </div>

      {mode === "list" ? (
        <div className="uiCard">
          <div className="uiTableWrap">
            <table className="uiTable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const c = customerMap[a.customerId];
                  const s = serviceMap[a.serviceId];
                  return (
                    <tr key={a.id}>
                      <td>{fmtDate(a.startISO)}</td>
                      <td>
                        {fmtTime(a.startISO)} → {fmtTime(a.endISO)}
                      </td>
                      <td>
                        <strong>{c?.name || "Unknown"}</strong>
                      </td>
                      <td>{s?.name || "Unknown"}</td>
                      <td>
                        <span className="uiPill">{a.status || "confirmed"}</span>
                      </td>
                      <td>
                        <div className="uiActions">
                          <button type="button" className="uiBtn" onClick={() => openEdit(a)}>
                            Edit
                          </button>
                          <button type="button" className="uiBtn uiBtnDanger" onClick={() => remove(a.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ color: "var(--muted)", padding: 18 }}>
                      No appointments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <WeekView
          weekDays={weekDays}
          appointments={weekAppointments}
          customerMap={customerMap}
          serviceMap={serviceMap}
          onPrev={() => setWeekOffset((v) => v - 1)}
          onNext={() => setWeekOffset((v) => v + 1)}
          onOpenEdit={openEdit}
        />
      )}

      <Modal
        open={open}
        title={editing ? "Edit Appointment" : "New Appointment"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="uiBtn" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" className="uiBtn uiBtnPrimary" onClick={save}>
              Save
            </button>
          </>
        }
      >
        <div className="uiGrid2">
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Customer</div>
            <select
              className="uiSelect"
              value={form.customerId}
              onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
            >
              <option value="">Select…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Service</div>
            <select
              className="uiSelect"
              value={form.serviceId}
              onChange={(e) => setForm((f) => recomputeEnd({ ...f, serviceId: e.target.value }))}
            >
              <option value="">Select…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMins}m)
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Date</div>
            <input
              className="uiInput"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => recomputeEnd({ ...f, date: e.target.value }))}
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Start time</div>
            <input
              className="uiInput"
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => recomputeEnd({ ...f, time: e.target.value }))}
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>End time (auto)</div>
            <input className="uiInput" value={form.endISO ? fmtTime(form.endISO) : ""} disabled />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Status</div>
            <select
              className="uiSelect"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="confirmed">confirmed</option>
              <option value="pending">pending</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Note</div>
            <input
              className="uiInput"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function WeekView({ weekDays, appointments, customerMap, serviceMap, onPrev, onNext, onOpenEdit }) {
  const START_HOUR = 8;
  const END_HOUR = 18;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

  const byDayHour = useMemo(() => {
    const map = {};
    for (const a of appointments) {
      const d = new Date(a.startISO);
      const key = `${d.toISOString().slice(0, 10)}-${d.getHours()}`;
      map[key] ||= [];
      map[key].push(a);
    }
    Object.values(map).forEach((arr) => arr.sort((x, y) => new Date(x.startISO) - new Date(y.startISO)));
    return map;
  }, [appointments]);

  function bucket(dateISO, hour) {
    return byDayHour[`${dateISO}-${hour}`] || [];
  }

  const shell = { border: "1px solid var(--border)", borderRadius: 16, background: "#fff", overflow: "hidden" };
  const scroller = { overflow: "auto", maxHeight: "calc(100vh - 260px)" };
  const grid = { minWidth: 1040, display: "grid", gridTemplateColumns: "110px repeat(7, 1fr)" };
  const topHeader = { position: "sticky", top: 0, zIndex: 5, background: "var(--panel-2)", borderBottom: "1px solid var(--border)" };

  const timeHeaderCell = {
    position: "sticky",
    left: 0,
    zIndex: 6,
    background: "var(--panel-2)",
    borderRight: "1px solid var(--border)",
    padding: 12,
    color: "var(--muted)",
    fontWeight: 800,
    fontSize: 12,
  };

  const dayHeaderCell = { padding: 12, borderLeft: "1px solid var(--border)" };

  const stickyTimeCell = {
    position: "sticky",
    left: 0,
    zIndex: 4,
    background: "#fff",
    borderRight: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
    padding: 12,
    color: "var(--muted)",
    fontWeight: 800,
    fontSize: 12,
    whiteSpace: "nowrap",
  };

  const slotCell = {
    borderLeft: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
    height: 78,
    padding: 10,
    background: "#fff",
  };

  const chip = {
    borderRadius: 14,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    padding: "10px 12px",
    cursor: "pointer",
    boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
  };

  const chipTime = { fontSize: 12, fontWeight: 900, color: "#1d4ed8" };
  const chipTitle = { fontSize: 14, fontWeight: 900, lineHeight: 1.2 };
  const chipSub = { fontSize: 12, color: "var(--muted)", fontWeight: 700 };

  return (
    <div className="uiCard uiCardPad">
      <div className="uiHeader" style={{ marginBottom: 12 }}>
        <div>
          <div className="uiTitle">Week view</div>
          <div className="uiSubtitle">Click an appointment to edit.</div>
        </div>
        <div className="uiToolbar">
          <button type="button" className="uiBtn" onClick={onPrev}>← Prev</button>
          <button type="button" className="uiBtn" onClick={onNext}>Next →</button>
        </div>
      </div>

      <div style={shell}>
        <div style={scroller}>
          <div style={{ ...grid, ...topHeader }}>
            <div style={timeHeaderCell}>Time</div>
            {weekDays.map((d) => (
              <div key={d.toISOString()} style={dayHeaderCell}>
                <div style={{ fontWeight: 950, fontSize: 14 }}>{shortDay(d)}</div>
                <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>{shortMD(d)}</div>
              </div>
            ))}
          </div>

          <div style={grid}>
            {hours.map((h) => (
              <FragmentRow
                key={h}
                hour={h}
                weekDays={weekDays}
                stickyTimeCell={stickyTimeCell}
                slotCell={slotCell}
                bucket={bucket}
                customerMap={customerMap}
                serviceMap={serviceMap}
                onOpenEdit={onOpenEdit}
                chip={chip}
                chipTime={chipTime}
                chipTitle={chipTitle}
                chipSub={chipSub}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FragmentRow({ hour, weekDays, stickyTimeCell, slotCell, bucket, customerMap, serviceMap, onOpenEdit, chip, chipTime, chipTitle, chipSub }) {
  const label = `${String(hour).padStart(2, "0")}:00`;

  return (
    <>
      <div style={stickyTimeCell}>{label}</div>

      {weekDays.map((d) => {
        const dateISO = d.toISOString().slice(0, 10);
        const items = bucket(dateISO, hour);

        return (
          <div key={`${dateISO}-${hour}`} style={slotCell}>
            {items.length === 0 ? null : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.slice(0, 2).map((a) => {
                  const c = customerMap[a.customerId];
                  const s = serviceMap[a.serviceId];

                  return (
                    <div
                      key={a.id}
                      onClick={() => onOpenEdit(a)}
                      style={chip}
                      title="Click to edit"
                    >
                      <div style={chipTime}>{fmtTime(a.startISO)}–{fmtTime(a.endISO)}</div>
                      <div style={chipTitle}>{c?.name || "Unknown"}</div>
                      <div style={chipSub}>{s?.name || "Unknown"}</div>
                    </div>
                  );
                })}

                {items.length > 2 && (
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", paddingLeft: 2 }}>
                    +{items.length - 2} more…
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
