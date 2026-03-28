import T from "../ui/tokens.js";

const TABS = [
  { id: "live",      label: "Live Predict"        },
  { id: "simulator", label: "What-if Simulator"   },
  { id: "history",   label: "Feedback & Learning" },
];

export default function Header({ tab, setTab, liveUsers, lastUpdated }) {
  return (
    <div style={{
      borderBottom: `1px solid ${T.border}`, padding: "13px 28px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: T.surface, position: "sticky", top: 0, zIndex: 100,
      boxShadow: T.shadow,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: T.rMd, flexShrink: 0,
          background: T.accent, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 18, filter: "brightness(10)" }}>⚡</span>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: T.tp }}>
            Queue<span style={{ color: T.accent }}>IQ</span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: T.teal,
              background: T.tealBg, border: `1px solid ${T.tealBorder}`,
              borderRadius: 5, padding: "2px 8px", marginLeft: 10, letterSpacing: ".05em",
            }}>HOSPITALS</span>
          </div>
          <div style={{ fontSize: 10, color: T.tm, letterSpacing: ".1em", fontWeight: 600 }}>
            QUEUE INTELLIGENCE SYSTEM
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 2, background: T.inputBg,
        border: `1px solid ${T.border}`, borderRadius: T.rMd, padding: 3,
      }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "7px 16px", borderRadius: T.r, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600, fontFamily: T.ff, transition: "all .18s",
            background: tab === id ? T.accent : "transparent",
            color:      tab === id ? "#fff"   : T.ts,
            boxShadow:  tab === id ? T.shadow : "none",
          }}>{label}</button>
        ))}
      </div>

      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, display: "inline-block", boxShadow: `0 0 0 2px ${T.greenBorder}` }} />
        <span style={{ fontSize: 12, color: T.ts, fontWeight: 500 }}>
          {liveUsers ?? 0} viewing · {lastUpdated ?? "–"}
        </span>
      </div>
    </div>
  );
}
