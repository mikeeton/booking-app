import { useMemo, useState } from "react";
import Modal from "../../components/ui/Modal";
import "../../components/ui/ui.css";
import { getServices, createService, updateService, deleteService } from "../../features/services/servicesStore";

export default function Services() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({ name: "", durationMins: 30, price: 0, active: true });

  const services = getServices();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter(s =>
      (s.name || "").toLowerCase().includes(q)
    );
  }, [services, query]);

  function openNew() {
    setEditing(null);
    setForm({ name: "", durationMins: 30, price: 0, active: true });
    setOpen(true);
  }

  function openEdit(s) {
    setEditing(s);
    setForm({ name: s.name || "", durationMins: s.durationMins || 30, price: s.price || 0, active: !!s.active });
    setOpen(true);
  }

  function save() {
    if (!form.name.trim()) return alert("Service name is required");
    if (editing) updateService(editing.id, form);
    else createService(form);
    setOpen(false);
  }

  function remove(id) {
    if (!confirm("Delete this service?")) return;
    deleteService(id);
  }

  return (
    <div className="uiPage">
      <div className="uiCard uiCardPad">
        <div className="uiHeader">
          <div>
            <div className="uiTitle">Services</div>
            <div className="uiSubtitle">What customers can book (duration + price).</div>
          </div>
          <div className="uiToolbar">
            <input
              className="uiInput"
              placeholder="Search services…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="button" className="uiBtn uiBtnPrimary" onClick={openNew}>+ New</button>
          </div>
        </div>
      </div>

      <div className="uiCard">
        <div className="uiTableWrap">
          <table className="uiTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Status</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.durationMins} mins</td>
                  <td>£{Number(s.price).toFixed(2)}</td>
                  <td>{s.active ? <span className="uiPill">Active</span> : <span className="uiPill" style={{background:"#fee2e2",color:"#991b1b"}}>Inactive</span>}</td>
                  <td>
                    <div className="uiActions">
                      <button type="button" className="uiBtn" onClick={() => openEdit(s)}>Edit</button>
                      <button type="button" className="uiBtn uiBtnDanger" onClick={() => remove(s.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="5" style={{ color: "var(--muted)", padding: 18 }}>No services found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        title={editing ? "Edit Service" : "New Service"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="uiBtn" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="uiBtn uiBtnPrimary" onClick={save}>Save</button>
          </>
        }
      >
        <div className="uiGrid2">
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Service name</div>
            <input className="uiInput" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Duration (mins)</div>
            <input
              className="uiInput"
              type="number"
              min="5"
              step="5"
              value={form.durationMins}
              onChange={(e) => setForm({ ...form, durationMins: Number(e.target.value) })}
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Price (£)</div>
            <input
              className="uiInput"
              type="number"
              min="0"
              step="0.5"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Active</div>
            <select
              className="uiSelect"
              value={form.active ? "yes" : "no"}
              onChange={(e) => setForm({ ...form, active: e.target.value === "yes" })}
            >
              <option value="yes">Active</option>
              <option value="no">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
