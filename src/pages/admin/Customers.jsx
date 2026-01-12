import { useMemo, useState } from "react";
import Modal from "../../components/ui/Modal";
import "../../components/ui/ui.css";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../../features/customers/customersStore";

export default function Customers() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  const customers = getCustomers();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    );
  }, [customers, query]);

  function openNew() {
    setEditing(null);
    setForm({ name: "", email: "", phone: "" });
    setOpen(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({ name: c.name || "", email: c.email || "", phone: c.phone || "" });
    setOpen(true);
  }

  function save() {
    if (!form.name.trim()) return alert("Customer name is required");
    if (editing) updateCustomer(editing.id, form);
    else createCustomer(form);
    setOpen(false);
  }

  function remove(id) {
    if (!confirm("Delete this customer?")) return;
    deleteCustomer(id);
  }

  return (
    <div className="uiPage">
      <div className="uiCard uiCardPad">
        <div className="uiHeader">
          <div>
            <div className="uiTitle">Customers</div>
            <div className="uiSubtitle">People who book appointments.</div>
          </div>
          <div className="uiToolbar">
            <input
              className="uiInput"
              placeholder="Search customers…"
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
                <th>Email</th>
                <th>Phone</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.email || <span style={{ color: "var(--muted)" }}>—</span>}</td>
                  <td>{c.phone || <span style={{ color: "var(--muted)" }}>—</span>}</td>
                  <td>
                    <div className="uiActions">
                      <button type="button" className="uiBtn" onClick={() => openEdit(c)}>Edit</button>
                      <button type="button" className="uiBtn uiBtnDanger" onClick={() => remove(c.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="4" style={{ color: "var(--muted)", padding: 18 }}>No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        title={editing ? "Edit Customer" : "New Customer"}
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
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Name</div>
            <input className="uiInput" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Email</div>
            <input className="uiInput" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Phone</div>
            <input className="uiInput" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
