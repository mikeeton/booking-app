import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./adminLayout.css";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="adminShell">
      <aside id="adminSidebar" className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <div className="brandLogo" aria-hidden="true">📅</div>
          <div>
            <div className="brandTitle">Booking Admin</div>
            <div className="brandSub">Manage your business</div>
          </div>
        </div>

        <nav className="nav" role="navigation" aria-label="Admin navigation">
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/services" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
            Services
          </NavLink>
          <NavLink to="/admin/customers" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
            Customers
          </NavLink>
          <NavLink to="/admin/appointments" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
            Appointments
          </NavLink>
          <NavLink to="/admin/availability" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
            Availability
          </NavLink>
        </nav>

        <div className="sidebarFooter">
          <NavLink to="/book" className="navLink">
            ← Customer booking
          </NavLink>
        </div>
        </aside>  

      {/* Mobile overlay and toggle */}
      {open && <div className="mobileOverlay" onClick={() => setOpen(false)} aria-hidden="true" />}

      <main id="main" className="adminMain">
        <button
          type="button"
          className="mobileNavToggle"
          aria-controls="adminSidebar"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((s) => !s)}
        >
          ☰
        </button>

        <Outlet />
      </main>
    </div>
  );
}
