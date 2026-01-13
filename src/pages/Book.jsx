// src/pages/Book.jsx
import { useMemo, useState, useEffect } from "react";
import "../components/ui/ui.css";


import { getServices } from "../features/services/servicesStore";
import { getAppointments, createAppointment } from "../features/appointments/appointmentsStore";
import { getCustomers, createCustomer, updateCustomer } from "../features/customers/customersStore";
import { getAvailability } from "../features/availability/availabilityStore";
import { useCustomerAuth } from "../features/customers/CustomerAuthProvider";
import { useNavigate } from "react-router-dom";

// ---------- time helpers ----------
function pad2(n) {
  return String(n).padStart(2, "0");
}
function dateISO(d) {
  return d.toISOString().slice(0, 10);
}
function toISO(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}
function addMins(iso, mins) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}
function fmtMoneyGBP(n) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(n || 0));
}
function fmtNiceDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "2-digit" });
}
function fmtTimeFromISO(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function overlaps(aStart, aEnd, bStart, bEnd) {
  const aS = new Date(aStart).getTime();
  const aE = new Date(aEnd).getTime();
  const bS = new Date(bStart).getTime();
  const bE = new Date(bEnd).getTime();
  return aS < bE && bS < aE;
}

// ---------- slot builder ----------
function buildSlots({ date, serviceMins, slotStepMins, dayAvail, apptsThatDay }) {
  if (!dayAvail || dayAvail.enabled === false) return [];
  const { start = "09:00", end = "17:00", breaks = [] } = dayAvail;

  const startISO = toISO(date, start);
  const endISO = toISO(date, end);

  const breakRanges = (breaks || [])
    .filter((b) => b?.start && b?.end)
    .map((b) => ({
      start: toISO(date, b.start),
      end: toISO(date, b.end),
    }));

  const slots = [];
  let cursor = startISO;

  while (new Date(addMins(cursor, serviceMins)).getTime() <= new Date(endISO).getTime()) {
    const slotStart = cursor;
    const slotEnd = addMins(cursor, serviceMins);

    const hitsBreak = breakRanges.some((br) => overlaps(slotStart, slotEnd, br.start, br.end));
    const hitsAppt = apptsThatDay.some((a) => overlaps(slotStart, slotEnd, a.startISO, a.endISO));

    if (!hitsBreak && !hitsAppt) {
      slots.push({ startISO: slotStart, endISO: slotEnd });
    }

    cursor = addMins(cursor, slotStepMins);
  }

  return slots;
}

export default function Book() {
  const navigate = useNavigate();
  const { current, authState, logout } = useCustomerAuth();

  // ✅ current logged-in customer (null if none)
  const customer = current?.() || null;
  const customerName = customer?.name || "Customer";

  // Wizard step: 1 service, 2 time, 3 confirm
  const [step, setStep] = useState(1);

  // selections
  const [serviceId, setServiceId] = useState(null);
  const [slotISO, setSlotISO] = useState(null);

  // date picker
  const [date, setDate] = useState(() => dateISO(new Date()));

  // customer details (for booking)
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");

  // ui state
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  // Load signed-in customer details when auth changes
  useEffect(() => {
    const c = current?.();
    if (c) {
      setCustName(c.name || "");
      setCustEmail(c.email || "");
      setCustPhone(c.phone || "");
    } else {
      setCustName("");
      setCustEmail("");
      setCustPhone("");
    }
  }, [authState, current]);

  function onCustomerLogout() {
    logout?.();

    // reset any active booking progress + forms
    setStep(1);
    setServiceId(null);
    setSlotISO(null);
    setCustName("");
    setCustEmail("");
    setCustPhone("");
    setErr("");
    setInfo("");
  }

  // data
  const services = useMemo(() => getServices(), []);
  const allAppts = useMemo(() => getAppointments(), []);
  const allCustomers = useMemo(() => getCustomers(), []);
  const availability = useMemo(() => getAvailability(), []);

  const selectedService = useMemo(() => services.find((s) => s.id === serviceId) || null, [services, serviceId]);
  const slotStepMins = useMemo(() => Number(availability?.slotStepMins || 15), [availability]);

  const apptsThatDay = useMemo(() => {
    const d = date;
    return allAppts
      .filter((a) => (a?.startISO || "").slice(0, 10) === d)
      .map((a) => ({
        startISO: a.startISO,
        endISO: a.endISO,
      }));
  }, [allAppts, date]);

  const dayAvail = useMemo(() => {
    const d = new Date(`${date}T00:00:00`);
    const dow = d.getDay(); // 0..6
    // availability.byDay[0..6] expected
    return availability?.byDay?.[dow] || { enabled: true, start: "09:00", end: "17:00", breaks: [] };
  }, [availability, date]);

  const slots = useMemo(() => {
    if (!selectedService) return [];
    const mins = Number(selectedService.durationMins || 30);
    return buildSlots({
      date,
      serviceMins: mins,
      slotStepMins,
      dayAvail,
      apptsThatDay,
    });
  }, [selectedService, date, slotStepMins, dayAvail, apptsThatDay]);

  const price = useMemo(() => Number(selectedService?.price || 0), [selectedService]);

  function canGoToTime() {
    return !!selectedService;
  }
  function canGoToConfirm() {
    return !!selectedService && !!slotISO;
  }

  function resetBooking() {
    setStep(1);
    setServiceId(null);
    setSlotISO(null);
    setErr("");
    setInfo("");
  }

  async function ensureCustomerRecord() {
    // ✅ If customer is already logged in, use their record
    const authed = current?.();
    if (authed) {
      updateCustomer(authed.id, {
        name: (custName || "").trim() || authed.name,
        phone: (custPhone || "").trim(),
      });
      return authed;
    }

    const emailNorm = (custEmail || "").trim().toLowerCase();
    const nameNorm = (custName || "").trim();

    if (!emailNorm.includes("@")) throw new Error("Enter a valid email address.");
    if (!nameNorm) throw new Error("Enter your name.");

    // Find existing by email
    const existing = allCustomers.find((c) => (c.email || "").toLowerCase() === emailNorm);

    if (!existing) {
      const created = createCustomer({ name: nameNorm, email: emailNorm, phone: (custPhone || "").trim() });
      return created;
    }

    // Update details if changed (nice polish)
    if (existing.name !== nameNorm || (existing.phone || "") !== (custPhone || "").trim()) {
      updateCustomer(existing.id, { name: nameNorm, phone: (custPhone || "").trim() });
    }

    return existing;
  }

  async function onConfirm() {
    setErr("");
    setInfo("");

    if (!selectedService) {
      setErr("Please select a service.");
      return;
    }
    if (!slotISO) {
      setErr("Please select a time slot.");
      return;
    }

    setBusy(true);
    try {
      const c = await ensureCustomerRecord();

      const startISO = slotISO;
      const endISO = addMins(startISO, Number(selectedService.durationMins || 30));

      //  Double-booking protection (re-check at confirm time)
const existing = getAppointments()
  .filter((a) => (a.status || "confirmed") !== "cancelled");

const taken = existing.some((a) => overlaps(startISO, endISO, a.startISO, a.endISO));

if (taken) {
  throw new Error("That slot was just taken. Please pick another time.");
}

      createAppointment({
        customerId: c.id,
        serviceId: selectedService.id,
        startISO,
        endISO,
        notes: "",
      });

      setInfo("Booking confirmed ✅");
      setStep(1);
      setServiceId(null);
      setSlotISO(null);
    } catch (e2) {
      setErr(e2?.message || "Could not create booking.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="uiPage" style={{ maxWidth: 1100, margin: "0 auto", padding: 18 }}>
      {/* Header */}
      <div className="uiCard uiCardPad">
        <div className="uiHeader">
          <div>
            <div className="uiTitle">Book an appointment</div>
            {/* <div className="uiSubtitle">Choose a service, pick a time, then confirm.</div> */}
          </div>

        </div>

        {/* Stepper */}
        <div style={{ marginTop: 14 }}>
          <div role="tablist" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              className={`uiBtn ${step === 1 ? "uiBtnPrimary" : ""}`}
              onClick={() => setStep(1)}
            >
              1 Service
            </button>
            <button
              type="button"
              className={`uiBtn ${step === 2 ? "uiBtnPrimary" : ""}`}
              onClick={() => canGoToTime() && setStep(2)}
              disabled={!canGoToTime()}
            >
              2 Time
            </button>
            <button
              type="button"
              className={`uiBtn ${step === 3 ? "uiBtnPrimary" : ""}`}
              onClick={() => canGoToConfirm() && setStep(3)}
              disabled={!canGoToConfirm()}
            >
              3 Confirm
            </button>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <span className="uiPill">Slot step: {slotStepMins} mins</span>
              <span className="uiPill">{selectedService ? selectedService.name : "Choose a service"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginTop: 14 }}>
        {/* Left: step content */}
        <div style={{ display: "grid", gap: 14 }}>
          {/* Step 1 */}
          {step === 1 && (
            <div className="uiCard uiCardPad">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 950, fontSize: 16 }}>1) Choose a service</div>
                  <div className="uiSubtitle">Pick what you want to book.</div>
                </div>

                <button type="button" className="uiBtn uiBtnPrimary" onClick={() => setStep(2)} disabled={!canGoToTime()}>
                  Next →
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                {services.map((s) => {
                  const active = s.id === serviceId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className="uiCard uiCardCompact"
                      onClick={() => setServiceId(s.id)}
                      style={{
                        textAlign: "left",
                        borderColor: active ? "rgba(37,99,235,.45)" : "var(--border)",
                        boxShadow: active ? "0 12px 26px rgba(37,99,235,.12)" : "var(--shadow)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 950 }}>{s.name}</div>
                        <span className="uiPill">{s.durationMins}m</span>
                      </div>
                      <div style={{ marginTop: 6, fontWeight: 900, color: "var(--muted)" }}>{fmtMoneyGBP(s.price)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="uiCard uiCardPad">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 950, fontSize: 16 }}>2) Pick a time</div>
                  <div className="uiSubtitle">Choose a day and an available slot.</div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input className="uiInput" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  <button type="button" className="uiBtn uiBtnPrimary" onClick={() => setStep(3)} disabled={!canGoToConfirm()}>
                    Next →
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                {!selectedService ? (
                  <div style={{ color: "var(--muted)", fontWeight: 900 }}>Please select a service first.</div>
                ) : !dayAvail || dayAvail.enabled === false ? (
                  <div style={{ color: "var(--muted)", fontWeight: 900 }}>
                    Closed this day (change in <strong>Admin → Availability</strong>).
                  </div>
                ) : slots.length === 0 ? (
                  <div style={{ color: "var(--muted)", fontWeight: 900 }}>No slots available for this day.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
                    {slots.map((s) => {
                      const active = s.startISO === slotISO;
                      return (
                        <button
                          key={s.startISO}
                          type="button"
                          className={`uiBtn ${active ? "uiBtnPrimary" : ""}`}
                          onClick={() => setSlotISO(s.startISO)}
                          style={{ justifyContent: "center" }}
                        >
                          {fmtTimeFromISO(s.startISO)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="uiCard uiCardPad">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 950, fontSize: 16 }}>3) Confirm</div>
                  <div className="uiSubtitle">Enter your details and confirm the booking.</div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" className="uiBtn" onClick={() => setStep(2)}>
                    ← Back
                  </button>
                  <button type="button" className="uiBtn" onClick={resetBooking}>
                    Reset
                  </button>
                </div>
              </div>

              {err && (
                <div className="uiNotice uiNoticeDanger" style={{ marginTop: 12 }}>
                  {err}
                </div>
              )}
              {info && (
                <div className="uiNotice uiNoticeOk" style={{ marginTop: 12 }}>
                  {info}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <label className="uiLabel">
                  Name
                  <input className="uiInput" value={custName} onChange={(e) => setCustName(e.target.value)} />
                </label>
                <label className="uiLabel">
                  Email
                  <input className="uiInput" type="email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} />
                </label>
                <label className="uiLabel">
                  Phone
                  <input className="uiInput" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} />
                </label>

                <div className="uiCard uiCardCompact" style={{ alignSelf: "end" }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 950 }}>Summary</div>
                    <div style={{ color: "var(--muted)", fontWeight: 850 }}>
                      {selectedService ? selectedService.name : "Not selected"}
                    </div>
                    <div style={{ fontWeight: 950 }}>{fmtNiceDate(date)}</div>
                    <div style={{ color: "var(--muted)", fontWeight: 850 }}>
                      {slotISO ? fmtTimeFromISO(slotISO) : "Not selected"}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <div style={{ fontWeight: 950 }}>Price</div>
                      <div style={{ fontWeight: 950 }}>{fmtMoneyGBP(price)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="uiBtn uiBtnPrimary"
                  onClick={onConfirm}
                  disabled={busy || !canGoToConfirm()}
                >
                  {busy ? "Confirming..." : "Confirm booking"}
                </button>

                {/* ✅ Only show sign in button when NOT logged in */}
                {!customer && (
                  <button type="button" className="uiBtn" onClick={() => navigate("/account")}>
                    Sign in / Create account
                  </button>
                )}
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>
                Powered by your admin availability rules.
              </div>
            </div>
          )}
        </div>

        {/* Right: booking summary */}
        <div className="uiCard uiCardPad" style={{ height: "fit-content" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 950, fontSize: 16 }}>Booking summary</div>
            <span className="uiPill">Step {step}/3</span>
          </div>

          {/* ✅ Customer section: show name + logout when logged in */}
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="uiPill">Customer</span>

            {customer ? (
              <>
                <span className="uiPill" style={{ fontWeight: 950 }}>
                  {customerName}
                </span>

                <button className="uiBtn" type="button" onClick={onCustomerLogout}>
                  Log out
                </button>
              </>
            ) : (
              <button className="uiBtn" type="button" onClick={() => navigate("/account")}>
                Sign in / Create account
              </button>
            )}
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Service</div>
              <div style={{ fontWeight: 950 }}>{selectedService ? selectedService.name : "Not selected"}</div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Date</div>
              <div style={{ fontWeight: 950 }}>{fmtNiceDate(date)}</div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Time</div>
              <div style={{ fontWeight: 950 }}>{slotISO ? fmtTimeFromISO(slotISO) : "Not selected"}</div>
            </div>

            <hr style={{ border: "none", borderTop: `1px solid var(--border)`, margin: "10px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 950 }}>Price</div>
              <div style={{ fontWeight: 950 }}>{fmtMoneyGBP(price)}</div>
            </div>

            <button
              className="uiBtn uiBtnPrimary"
              type="button"
              onClick={() => {
                if (step === 1 && canGoToTime()) setStep(2);
                else if (step === 2 && canGoToConfirm()) setStep(3);
                else if (step === 3) onConfirm();
              }}
              disabled={(step === 1 && !canGoToTime()) || (step === 2 && !canGoToConfirm()) || busy}
              style={{ marginTop: 10 }}
            >
              {step === 3 ? (busy ? "Confirming..." : "Confirm booking") : "Continue"}
            </button>

            <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>
              Powered by your admin availability rules.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
