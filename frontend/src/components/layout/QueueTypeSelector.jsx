import T from "../ui/tokens.js";
import QUEUE_HOURS from "../../data/queueHours.js";

const ICONS = { doctor: "🩺", billing: "🧾", pharmacy: "💊" };

export default function QueueTypeSelector({ hospital, queueKey, setQueueKey, currentHour }) {
  if (!hospital) return null;
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
      {Object.entries(hospital.queues).map(([key, q]) => {
        const hrs    = QUEUE_HOURS[key];
        const isOpen = hrs ? (currentHour >= hrs.open && currentHour <= hrs.close) : true;
        const sel    = queueKey === key;
        return (
          <button key={key} onClick={() => setQueueKey(key)} style={{
            flex: 1, padding: "11px 12px", borderRadius: T.rMd, cursor: "pointer",
            fontFamily: T.ff, transition: "all .18s",
            border: `1.5px solid ${sel ? T.accent : T.border}`,
            background: sel ? T.accentLight : T.card,
            color: sel ? T.accentDark : T.ts, fontWeight: sel ? 700 : 400, fontSize: 13,
            boxShadow: sel ? `0 0 0 3px ${T.accentBorder}, ${T.shadow}` : T.shadow,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          }}>
            <span style={{ fontSize: 18 }}>{ICONS[key] ?? "🏥"}</span>
            <span style={{ color: sel ? T.accentDark : T.tp }}>{q.label}</span>
            <span style={{
              fontSize: 10, borderRadius: 4, padding: "1px 7px",
              color:      isOpen ? T.green : T.red,
              background: isOpen ? T.greenBg : T.redBg,
              border:     `1px solid ${isOpen ? T.greenBorder : T.redBorder}`,
              fontWeight: 600,
            }}>
              {hrs ? hrs.label : "24hr"} {isOpen ? "● Open" : "● Closed"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
