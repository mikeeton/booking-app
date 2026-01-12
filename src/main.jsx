import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

import { AuthProvider } from "./features/auth/AuthProvider";
import { CustomerAuthProvider } from "./features/customers/CustomerAuthProvider";

if (import.meta.env.DEV) {
  (async () => {
    try {
      // Dynamic import: allow Vite to ignore static analysis for optional dev-only package
      // @vite-ignore
      const reactAxe = await import(/* @vite-ignore */ "react-axe");
      try { reactAxe?.default?.(React, ReactDOM, 1000); } catch (e) {}
    } catch (err) {}
  })();
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <CustomerAuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CustomerAuthProvider>
    </AuthProvider>
  </React.StrictMode>
);
