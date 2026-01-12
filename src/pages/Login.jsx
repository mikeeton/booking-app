// src/pages/Login.jsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../components/ui/ui.css";
import { useAuth } from "../features/auth/AuthProvider";

export default function Login() {
  const { login, loading, authState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If user was redirected here from /admin/*, go back there after login
  const from = useMemo(() => {
    return location.state?.from?.pathname || "/admin";
  }, [location.state]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);

  // Optional: if already authed, send to admin
  // (authState shape depends on your provider; this is safe-ish)
  const isLoggedIn = !!authState?.user;

  // If you want auto-redirect when already logged in, uncomment:
  // if (isLoggedIn) navigate("/admin", { replace: true });

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!username.trim() || !password) {
      setErr("Please enter username and password.");
      return;
    }

    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Login failed");
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="authHeader">
          <div className="authHeaderRow">
            <div>
              <h1 className="authTitle">Admin Login</h1>
              <div className="authSubtitle">Sign in to manage services, customers and appointments.</div>

              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="uiBtn"
                  onClick={() => navigate("/account", { replace: true })}
                >
                  ← Customer account
                </button>
              </div>
            </div>

            <div className="authBadge" aria-hidden="true">
              🔐
            </div>
          </div>
        </div>

        <div className="authBody">
          {err && <div className="authNotice danger">{err}</div>}

          <form className="authForm" onSubmit={onSubmit}>
            <label className="authLabel">
              Username
              <input
                className="authInput"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="admin"
                required
                autoFocus
              />
            </label>

            <label className="authLabel" style={{ position: "relative" }}>
              Password
              <input
                className="authInput"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />

              <button
                type="button"
                className="uiIconBtn"
                aria-pressed={show}
                onClick={() => setShow((s) => !s)}
                style={{ position: "absolute", right: 8, top: 34 }}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "🙈" : "👁️"}
              </button>
            </label>

            <button className="authPrimaryBtn" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
              Tip: Customers sign in on the Account page using an email address.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
