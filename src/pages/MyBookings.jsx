// src/pages/MyBookings.jsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../components/ui/ui.css";

import { useCustomerAuth } from "../features/customers/CustomerAuthProvider";
import { getAppointments, updateAppointment } from "../features/appointments/appointmentsStore";
import { getServices } from "../features/services/servicesStore";

function fmtNiceDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyBookings() {
  const navigate = useNavigate();
  const { current } = useCustomerAuth();

  const customer = useMemo(() => {
    try {
      return current?.() ?? null;
    } catch {
      return null;
    }
  }, [current]);

  const services = useMemo(() => getServices(), []);
  const serviceNameById = useMemo(() => {
    const m = new Map();
    for (const s of services) m.set(s.id, s.name);
    return m;
  }, [services]);

  const myAppointments = useMemo(() => {
    const all = getAppointments();
    const mine = all.filter((a) => a.customerId === customer?.id);

    // Show newest first
    mine.sort((a, b) => new Date(b.startISO).getTime() - new Date(a.startISO).getTime());
    return mine;
  }, [customer?.id]);

  function cancelBooking(apptId) {
    // keep history instead of deleting (more realistic)
    updateAppointment(apptId, { status: "cancelled" });
  }

  return (
    <div className="uiPage" style={{ maxWidth: 980, margin: "0 auto", padding: 18 }}>
      <div className="uiCard uiCardPad">
        <div className="uiHeader">
          <div>
            <div className="uiTitle">My bookings</div>
            <div className="uiSubtitle">
              Signed in as <strong>{customer?.name || "Customer"}</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="uiBtn" type="button" onClick={() => navigate("/book")}>
              ← Back to booking
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        {myAppointments.length === 0 ? (
          <div className="uiCard uiCardPad">
            <div style={{ fontWeight: 950 }}>No bookings yet</div>
            <div className="uiSubtitle" style={{ marginTop: 6 }}>
              Book your first appointment from the booking page.
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="uiBtn uiBtnPrimary" type="button" onClick={() => navigate("/book")}>
                Book now
              </button>
            </div>
          </div>
        ) : (
          myAppointments.map((a) => {
            const serviceName = serviceNameById.get(a.serviceId) || "Service";
            const isCancelled = (a.status || "").toLowerCase() === "cancelled";

            return (
              <div key={a.id} className="uiCard uiCardPad">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 950, fontSize: 16 }}>{serviceName}</div>
                    <div style={{ color: "var(--muted)", fontWeight: 850 }}>
                      {fmtNiceDateTime(a.startISO)} → {fmtNiceDateTime(a.endISO)}
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                      <span className="uiPill" style={{ fontWeight: 950 }}>
                        {a.status || "confirmed"}
                      </span>
                      {a.note ? (
                        <span className="uiPill" title={a.note}>
                          Note
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {!isCancelled && (
                      <button className="uiBtn" type="button" onClick={() => cancelBooking(a.id)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
