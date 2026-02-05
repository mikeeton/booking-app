import { useEffect, useMemo, useState } from "react";
import "../../components/ui/ui.css";

import { getAppointments } from "../../features/appointments/appointmentsStore";
import { getCustomers } from "../../features/customers/customersStore";
import { getServices } from "../../features/services/servicesStore";

import {
  PieChart, Pie, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";

export default function Dashboard() {
  const [appts, setAppts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const [apptsRes, customersRes, servicesRes] = await Promise.all([
          getAppointments(),
          getCustomers(),
          getServices(),
        ]);

        if (!alive) return;

        setAppts(apptsRes?.appointments ?? []);
        setCustomers(customersRes?.customers ?? customersRes ?? []);
        setServices(servicesRes?.services ?? servicesRes ?? []);
      } catch (e) {
        console.error("Dashboard load failed:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  const pieData = useMemo(() => {
    return services
      .map((s) => ({
        name: s.name,
        value: appts.filter((a) => a.serviceId === s.id).length,
      }))
      .filter((x) => x.value > 0);
  }, [services, appts]);

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const count = appts.filter(
        (a) => new Date(a.startISO).toISOString().slice(0, 10) === key
      ).length;
      return { day: d.toLocaleDateString([], { weekday: "short" }), count };
    });
  }, [appts]);

  if (loading) {
    return (
      <div className="uiPage">
        <div className="uiCard uiCardPad">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="uiPage">
      <div className="uiCard uiCardPad">
        <div className="uiHeader">
          <div>
            <div className="uiTitle">Dashboard</div>
            <div className="uiSubtitle">Overview of bookings and activity.</div>
          </div>
        </div>
      </div>

      <div className="uiGrid2">
        <div className="uiCard uiCardPad">
          <div style={{ fontWeight: 900, fontSize: 14, color: "var(--muted)" }}>Appointments</div>
          <div style={{ fontWeight: 950, fontSize: 34, marginTop: 6 }}>{appts.length}</div>
        </div>
        <div className="uiCard uiCardPad">
          <div style={{ fontWeight: 900, fontSize: 14, color: "var(--muted)" }}>Customers</div>
          <div style={{ fontWeight: 950, fontSize: 34, marginTop: 6 }}>{customers.length}</div>
        </div>
      </div>

      <div className="uiGrid2">
        <div className="uiCard uiCardPad" style={{ height: 340 }}>
          <div style={{ fontWeight: 950, marginBottom: 10 }}>Appointments by Service</div>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          {pieData.length === 0 && (
            <div style={{ color: "var(--muted)" }}>
              No data yet — create services + appointments.
            </div>
          )}
        </div>

        <div className="uiCard uiCardPad" style={{ height: 340 }}>
          <div style={{ fontWeight: 950, marginBottom: 10 }}>Appointments (Last 7 Days)</div>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
