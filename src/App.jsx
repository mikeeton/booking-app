// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Services from "./pages/admin/Services";
import Customers from "./pages/admin/Customers";
import Appointments from "./pages/admin/Appointments";
import Availability from "./pages/admin/Availability";

import Book from "./pages/Book";
import Account from "./pages/Account";
import Login from "./pages/Login";
import MyBookings from "./pages/MyBookings";

import ProtectedRoute from "./features/auth/ProtectedRoute";
import CustomerProtectedRoute from "./features/customers/CustomerProtectedRoute";

export default function App() {
  return (
    <>
      <a href="#main" className="sr-only sr-only-focusable">
        Skip to main content
      </a>

      {/* ✅ One global main landmark for the whole app */}
      <main id="main">
        <Routes>
          <Route path="/" element={<Navigate to="/account" replace />} />

          {/* Public */}
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<Login />} />

          {/* Customer protected */}
          <Route element={<CustomerProtectedRoute />}>
            <Route path="/book" element={<Book />} />
            <Route path="/my-bookings" element={<MyBookings />} />
          </Route>

          {/* Admin protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="services" element={<Services />} />
              <Route path="customers" element={<Customers />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="availability" element={<Availability />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/account" replace />} />
        </Routes>
      </main>
    </>
  );
}
