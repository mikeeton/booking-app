import { useMemo, useState, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import "../../components/ui/ui.css";
import { getAvailability, saveAvailability } from "../../features/availability/availabilityStore";

const dayLabels = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

function Badge({ children, tone = "info" }) {
  const styles = {
    info: { background: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8" },
    ok: { background: "#ecfdf5", border: "#bbf7d0", color: "#047857" },
    warn: { background: "#fffbeb", border: "#fde68a", color: "#92400e" },
    mute: { background: "#f1f5f9", border: "#e2e8f0", color: "#475569" },
  }[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${styles.border}`,
        background: styles.background,
        color: styles.color,
        fontWeight: 900,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
      <span className="sr-only">{label}</span>
      <input className="sr-only" type="checkbox" checked={checked} onChange={onChange} aria-label={label} />
      <span
        aria-hidden="true"
        style={{
          width: 46,
          height: 28,
          borderRadius: 999,
          border: "1px solid var(--border)",
          background: checked ? "rgba(37,99,235,0.18)" : "#fff",
          display: "inline-flex",
          alignItems: "center",
          padding: 3,
          transition: "140ms ease",
          boxShadow: checked ? "0 8px 20px rgba(37,99,235,.12)" : "none",
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            background: checked ? "var(--primary)" : "#e2e8f0",
            transform: checked ? "translateX(18px)" : "translateX(0px)",
            transition: "140ms ease",
            boxShadow: "0 6px 14px rgba(15,23,42,.12)",
          }}
        />
      </span>
      <span style={{ fontWeight: 900, fontSize: 13, color: "var(--muted)" }}>{checked ? "On" : "Off"}</span>
    </label>
  );
}

export default function Availability() {
  const defaultWeek = {
    mon: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "12:30", end: "13:00" }] },
    tue: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "12:30", end: "13:00" }] },
    wed: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "12:30", end: "13:00" }] },
    thu: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "12:30", end: "13:00" }] },
    fri: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "12:30", end: "13:00" }] },
    sat: { enabled: false, start: "09:00", end: "17:00", breaks: [] },
    sun: { enabled: false, start: "09:00", end: "17:00", breaks: [] },
  };

  const [data, setData] = useState({ slotStepMins: 15, week: defaultWeek });
  useEffect(() => {
    let mounted = true;
    getAvailability()
      .then((d) => {
        if (!mounted) return;
        // normalize returned shape: api returns { slotStepMins, byDay }
        const week = d?.byDay || d?.week || defaultWeek;
        setData({ slotStepMins: d?.slotStepMins ?? 15, week });
      })
      .catch(() => {
        // keep defaults on error
      });
    return () => (mounted = false);
  }, []);
  const [openBreaks, setOpenBreaks] = useState(null); // dayKey
  const [savedMessage, setSavedMessage] = useState("");

  const enabledCount = useMemo(() => {
    const keys = Object.keys(dayLabels);
    return keys.reduce((acc, k) => acc + (data?.week?.[k]?.enabled ? 1 : 0), 0);
  }, [data]);

  function updateDay(dayKey, patch) {
    setData((d) => ({
      ...d,
      week: { ...d.week, [dayKey]: { ...d.week[dayKey], ...patch } },
    }));
  }

  function addBreak(dayKey) {
    const day = data.week[dayKey];
    const next = [...(day.breaks || []), { start: "13:00", end: "14:00" }];
    updateDay(dayKey, { breaks: next });
  }

  function updateBreak(dayKey, idx, patch) {
    const day = data.week[dayKey];
    const next = (day.breaks || []).map((b, i) => (i === idx ? { ...b, ...patch } : b));
    updateDay(dayKey, { breaks: next });
  }

  function removeBreak(dayKey, idx) {
    const day = data.week[dayKey];
    const next = (day.breaks || []).filter((_, i) => i !== idx);
    updateDay(dayKey, { breaks: next });
  }

  async function save() {
    try {
      const saved = await saveAvailability({ slotStepMins: data.slotStepMins, byDay: data.week });
      // normalize returned value
      setData({ slotStepMins: saved?.slotStepMins ?? data.slotStepMins, week: saved?.byDay || data.week });
      setSavedMessage("Saved ✅");
      setTimeout(() => setSavedMessage(""), 2500);
    } catch (e) {
      setSavedMessage("Save failed");
      setTimeout(() => setSavedMessage(""), 2500);
    }
  }

  return (
    <div className="uiPage" style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 0 24px" }}>
      {/* Header */}
      <div className="uiCard uiCardPad" style={{ position: "sticky", top: 10, zIndex: 5, backdropFilter: "blur(6px)" }}>
        <div className="uiHeader">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div className="uiTitle" style={{ fontSize: 24 }}>Availability</div>
              <Badge tone="mute">{enabledCount}/7 days enabled</Badge>
              <Badge tone="info">Slot: {data.slotStepMins} mins</Badge>
            </div>
            <div className="uiSubtitle">Set working hours and breaks. Used by /book and the calendar.</div>
          </div>

          <div className="uiToolbar" style={{ alignItems: "flex-end" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6, color: "var(--muted)" }}>Slot size</div>
              <select
                className="uiSelect"
                aria-label="Slot size"
                value={data.slotStepMins}
                onChange={(e) => setData((d) => ({ ...d, slotStepMins: Number(e.target.value) }))}
                style={{ minWidth: 170 }}
              >
                <option value={10}>10 mins</option>
                <option value={15}>15 mins</option>
                <option value={20}>20 mins</option>
                <option value={30}>30 mins</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" className="uiBtn uiBtnPrimary uiBtnLarge" onClick={save} aria-label="Save availability">
                Save
              </button>
              <div role="status" aria-live="polite" style={{ fontWeight: 900, color: "#047857", minWidth: 80 }}>
                {savedMessage}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="uiCard" style={{ overflow: "hidden" }}>
        <div className="uiTableWrap">
          <table className="uiTable">
            <caption className="sr-only">Availability table — working hours and breaks</caption>
            <thead>
              <tr>
                <th>Day</th>
                <th>Enabled</th>
                <th>Start</th>
                <th>End</th>
                <th>Breaks</th>
                <th style={{ width: 260 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {Object.keys(dayLabels).map((dayKey) => {
                const day = data.week[dayKey];
                const breaksCount = (day.breaks || []).length;

                return (
                  <tr key={dayKey}>
                    <td data-label="Day">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <strong style={{ fontSize: 15 }}>{dayLabels[dayKey]}</strong>
                        {!day.enabled ? <Badge tone="mute">Closed</Badge> : <Badge tone="ok">Open</Badge>}
                      </div>
                    </td>

                    <td data-label="Enabled">
                      <Toggle
                        checked={!!day.enabled}
                        onChange={(e) => updateDay(dayKey, { enabled: e.target.checked })}
                        label={`Enable ${dayLabels[dayKey]}`}
                      />
                    </td>

                    <td data-label="Start">
                      <input
                        className="uiInput"
                        type="time"
                        aria-label={`Start time for ${dayLabels[dayKey]}`}
                        value={day.start}
                        onChange={(e) => updateDay(dayKey, { start: e.target.value })}
                        disabled={!day.enabled}
                        style={{ minWidth: 160 }}
                      />
                    </td>

                    <td data-label="End">
                      <input
                        className="uiInput"
                        type="time"
                        aria-label={`End time for ${dayLabels[dayKey]}`}
                        value={day.end}
                        onChange={(e) => updateDay(dayKey, { end: e.target.value })}
                        disabled={!day.enabled}
                        style={{ minWidth: 160 }}
                      />
                    </td>

                    <td data-label="Breaks">
                      {breaksCount ? (
                        <Badge tone="info">{breaksCount} break{breaksCount > 1 ? "s" : ""}</Badge>
                      ) : (
                        <span style={{ color: "var(--muted)", fontWeight: 900 }}>—</span>
                      )}
                    </td>

                    <td data-label="Actions">
                      <div className="uiActions" style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="uiBtn uiBtnSmall"
                          onClick={() => setOpenBreaks(dayKey)}
                          aria-label={`Manage breaks for ${dayLabels[dayKey]}`}
                        >
                          Manage breaks
                        </button>

                        <button
                          type="button"
                          className="uiBtn uiBtnSmall"
                          onClick={() => addBreak(dayKey)}
                          disabled={!day.enabled}
                          aria-label={`Add break to ${dayLabels[dayKey]}`}
                          style={{
                            border: "1px dashed rgba(37,99,235,.35)",
                            background: day.enabled ? "#fff" : "#f8fafc",
                          }}
                        >
                          + Break
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breaks modal */}
      <Modal
        open={!!openBreaks}
        title={openBreaks ? `Breaks — ${dayLabels[openBreaks]}` : "Breaks"}
        onClose={() => setOpenBreaks(null)}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 10, alignItems: "center" }}>
            <div style={{ color: "var(--muted)", fontWeight: 900, fontSize: 13 }}>
              Tip: keep breaks inside working hours.
            </div>
            <button type="button" className="uiBtn uiBtnPrimary" onClick={() => setOpenBreaks(null)}>
              Done
            </button>
          </div>
        }
      >
        {openBreaks && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
              <Badge tone="info">
                {(data.week[openBreaks].breaks || []).length} break(s)
              </Badge>
              <button
                type="button"
                className="uiBtn"
                onClick={() => addBreak(openBreaks)}
                disabled={!data.week[openBreaks].enabled}
              >
                + Add break
              </button>
            </div>

            {(data.week[openBreaks].breaks || []).map((b, idx) => (
              <div
                key={idx}
                className="uiCard uiCardPad"
                style={{
                  background: "linear-gradient(var(--panel), var(--panel-2))",
                  border: "1px solid rgba(37,99,235,.10)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>Break #{idx + 1}</div>
                  <button
                    type="button"
                    className="uiBtn uiBtnSmall uiBtnDanger"
                    onClick={() => removeBreak(openBreaks, idx)}
                    aria-label={`Remove break ${idx + 1} for ${dayLabels[openBreaks]}`}
                  >
                    Remove
                  </button>
                </div>

                <div className="uiGrid2" style={{ marginTop: 12 }}>
                  <div>
                    <div style={{ fontWeight: 900, marginBottom: 6, color: "var(--muted)" }}>Start</div>
                    <input
                      className="uiInput"
                      type="time"
                      value={b.start}
                      onChange={(e) => updateBreak(openBreaks, idx, { start: e.target.value })}
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, marginBottom: 6, color: "var(--muted)" }}>End</div>
                    <input
                      className="uiInput"
                      type="time"
                      value={b.end}
                      onChange={(e) => updateBreak(openBreaks, idx, { end: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}

            {(data.week[openBreaks].breaks || []).length === 0 && (
              <div style={{ color: "var(--muted)", fontWeight: 900 }}>No breaks yet.</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
