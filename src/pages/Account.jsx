// src/pages/Account.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../components/ui/ui.css";
import { useCustomerAuth } from "../features/customers/CustomerAuthProvider";

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "C";
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase() || "C";
}

export default function Account() {
  const navigate = useNavigate();

  const {
    login,
    register,
    requestReset,
    doReset,
    logout,
    current,
    loading,
    authState,
  } = useCustomerAuth();

  const [tab, setTab] = useState("login");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [resetCode, setResetCode] = useState("");

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const customer = useMemo(() => {
    try {
      return current?.() ?? null;
    } catch {
      return null;
    }
  }, [current, authState]);

  useEffect(() => {
    setErr("");
    setInfo("");

    const c = customer;

    if (c) {
      setTab("profile");
      setName(c.name || "");
      setEmail(c.email || "");
      setPhone(c.phone || "");
      setPassword("");
      setResetCode("");
    } else {
      setTab("login");
      setPassword("");
      setResetCode("");
    }
  }, [customer]);

  function goAdminLogin() {
    navigate("/login", { replace: true });
  }

  function normalizeEmail(raw) {
    return (raw || "").trim().toLowerCase();
  }

  async function onLogin(e) {
    e.preventDefault();
    setErr("");
    setInfo("");

    const e1 = normalizeEmail(email);

    if (!e1.includes("@")) {
      goAdminLogin();
      return;
    }

    if (!password) {
      setErr("Please enter your password.");
      return;
    }

    try {
      await login(e1, password);
      navigate("/book", { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Login failed");
    }
  }

  async function onSignup(e) {
    e.preventDefault();
    setErr("");
    setInfo("");

    const e1 = normalizeEmail(email);

    if (!e1.includes("@")) {
      setErr("Please enter a valid email address.");
      return;
    }
    if (!name.trim()) {
      setErr("Please enter your name.");
      return;
    }
    if (!password || password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: e1,
        phone: (phone || "").trim(),
        password,
      });
      navigate("/book", { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Sign up failed");
    }
  }

  async function onRequestReset(e) {
    e.preventDefault();
    setErr("");
    setInfo("");

    const e1 = normalizeEmail(email);

    if (!e1.includes("@")) {
      setErr("Please enter the email you signed up with.");
      return;
    }

    try {
      const code = await requestReset(e1);
      setInfo(
        code
          ? `Reset code (demo): ${code}`
          : "If that email exists, a reset code has been generated (demo)."
      );
      setTab("reset");
    } catch (e2) {
      setErr(e2?.message || "Could not request reset");
    }
  }

  async function onReset(e) {
    e.preventDefault();
    setErr("");
    setInfo("");

    const e1 = normalizeEmail(email);

    if (!e1.includes("@")) {
      setErr("Please enter a valid email address.");
      return;
    }
    if (!resetCode.trim()) {
      setErr("Please enter the reset code.");
      return;
    }
    if (!password || password.length < 6) {
      setErr("New password must be at least 6 characters.");
      return;
    }

    try {
      await doReset(e1, resetCode.trim(), password);
      setInfo("Password updated — you can now sign in.");
      setPassword("");
      setResetCode("");
      setTab("login");
    } catch (e2) {
      setErr(e2?.message || "Reset failed");
    }
  }

  function onSignOut() {
    try {
      logout?.();
    } catch {
      // ignore
    }

    setInfo("Signed out");
    setErr("");
    setPassword("");
    setResetCode("");
    setTab("login");
    navigate("/account", { replace: true });
  }

  const initials = getInitials(customer?.name || name);

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="authHeader">
          <div className="authHeaderRow">
            <div>
              <h1 className="authTitle">Account</h1>
              <div className="authSubtitle">
                Customer sign in / sign up. Admin accounts use the Admin Login page.
              </div>

              <div style={{ marginTop: 10 }}>
                <button type="button" className="uiBtn" onClick={goAdminLogin}>
                  Admin sign in →
                </button>
              </div>
            </div>

            {/* nicer badge */}
            <div className="authBadge" aria-hidden="true" style={{ fontWeight: 950 }}>
              {initials}
            </div>
          </div>
        </div>

        <div className="authBody">
          {err && <div className="authNotice danger">{err}</div>}
          {info && <div className="authNotice ok">{info}</div>}

          {/* PROFILE */}
          {customer ? (
            <div className="authProfileWrap">
              <div className="authProfileTop">
                <div className="authProfileTitle">Signed in</div>
                <span className="uiPill">Customer</span>
              </div>

              <div className="authProfileCard">
                <div className="authKV">
                  <div className="authK">Name</div>
                  <div className="authV">{customer.name || "—"}</div>
                </div>

                <div className="authKV">
                  <div className="authK">Email</div>
                  <div className="authV">{customer.email || "—"}</div>
                </div>

                <div className="authKV">
                  <div className="authK">Phone</div>
                  <div className="authV">{customer.phone || "—"}</div>
                </div>
              </div>

              <div className="authActions" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="authPrimaryBtn"
                  onClick={() => navigate("/book", { replace: true })}
                >
                  Go to booking
                </button>

                <button type="button" className="authSecondaryBtn" onClick={onSignOut}>
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="authTabs">
                <button
                  type="button"
                  className={`authTab ${tab === "login" ? "active" : ""}`}
                  onClick={() => {
                    setErr("");
                    setInfo("");
                    setTab("login");
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`authTab ${tab === "signup" ? "active" : ""}`}
                  onClick={() => {
                    setErr("");
                    setInfo("");
                    setTab("signup");
                  }}
                >
                  Sign up
                </button>
                <button
                  type="button"
                  className={`authTab ${tab === "forgot" || tab === "reset" ? "active" : ""}`}
                  onClick={() => {
                    setErr("");
                    setInfo("");
                    setTab("forgot");
                  }}
                >
                  Reset
                </button>
              </div>

              {/* LOGIN */}
              {tab === "login" && (
                <form className="authForm" onSubmit={onLogin}>
                  <label className="authLabel">
                    Customer email
                    <input
                      className="authInput"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>

                  <label className="authLabel">
                    Password
                    <input
                      className="authInput"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </label>

                  <div className="authActions">
                    <button className="authPrimaryBtn" type="submit" disabled={loading}>
                      {loading ? "Signing in..." : "Sign in"}
                    </button>

                    <button
                      className="authSecondaryBtn"
                      type="button"
                      onClick={() => {
                        setErr("");
                        setInfo("");
                        setTab("forgot");
                      }}
                    >
                      Forgot?
                    </button>
                  </div>
                </form>
              )}

              {/* SIGNUP */}
              {tab === "signup" && (
                <form className="authForm" onSubmit={onSignup}>
                  <label className="authLabel">
                    Full name
                    <input
                      className="authInput"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </label>

                  <label className="authLabel">
                    Email
                    <input
                      className="authInput"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>

                  <label className="authLabel">
                    Phone (optional)
                    <input
                      className="authInput"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 07..."
                    />
                  </label>

                  <label className="authLabel">
                    Password
                    <input
                      className="authInput"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </label>

                  <div className="authActions">
                    <button className="authPrimaryBtn" type="submit" disabled={loading}>
                      {loading ? "Creating..." : "Create account"}
                    </button>

                    <button
                      className="authSecondaryBtn"
                      type="button"
                      onClick={() => {
                        setErr("");
                        setInfo("");
                        setTab("login");
                      }}
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}

              {/* FORGOT */}
              {tab === "forgot" && (
                <form className="authForm" onSubmit={onRequestReset}>
                  <label className="authLabel">
                    Email
                    <input
                      className="authInput"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>

                  <div className="authActions">
                    <button className="authPrimaryBtn" type="submit" disabled={loading}>
                      {loading ? "Sending..." : "Get reset code"}
                    </button>

                    <button
                      className="authSecondaryBtn"
                      type="button"
                      onClick={() => {
                        setErr("");
                        setInfo("");
                        setTab("login");
                      }}
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}

              {/* RESET */}
              {tab === "reset" && (
                <form className="authForm" onSubmit={onReset}>
                  <label className="authLabel">
                    Email
                    <input
                      className="authInput"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>

                  <label className="authLabel">
                    Reset code
                    <input
                      className="authInput"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Enter code"
                      required
                    />
                  </label>

                  <label className="authLabel">
                    New password
                    <input
                      className="authInput"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </label>

                  <div className="authActions">
                    <button className="authPrimaryBtn" type="submit" disabled={loading}>
                      {loading ? "Resetting..." : "Reset password"}
                    </button>

                    <button
                      className="authSecondaryBtn"
                      type="button"
                      onClick={() => {
                        setErr("");
                        setInfo("");
                        setTab("login");
                      }}
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
