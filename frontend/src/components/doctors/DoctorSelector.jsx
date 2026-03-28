import { useState } from "react";
import T from "../ui/tokens.js";
import { fmt12 } from "../../utils/time.js";

const SPECIALTY_ICONS = {
  "Cardiology": "❤️", "Interventional Cardiology": "❤️",
  "Neurology": "🧠", "Neurosurgery": "🧠",
  "Orthopedics": "🦴", "Spine Surgery": "🦴",
  "General OPD": "🩺", "General Medicine": "🩺", "General Surgery": "✂️",
  "Gastroenterology": "🫁", "Physiotherapy": "💪",
  "Diabetology": "💉", "Thyroid & Endocrine": "💉", "Endocrinology": "💉",
  "Pediatrics": "👶", "Gynecology": "🌸", "Obstetrics": "🌸",
  "Surgery": "✂️",
};

function PopularityBar({ value }) {
  const color = value >= 85 ? T.red : value >= 70 ? T.amber : T.green;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 3, background: T.border, borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 2, transition: "width .3s" }} />
      </div>
      <span style={{ fontSize: 10, color: T.ts, minWidth: 28 }}>{value}/100</span>
    </div>
  );
}

export default function DoctorSelector({ hospital, currentHour, selectedDoctor, onSelect }) {
  const [open, setOpen] = useState(false);
  const doctors = hospital?.doctors ?? [];

  if (!hospital || doctors.length === 0 || !hospital.queues.doctor) return null;

  const selected = doctors.find(d => d.id === selectedDoctor);
  const isAvailNow = (d) => d.availStart <= currentHour && currentHour < d.availEnd;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: T.ts, fontWeight: 600, marginBottom: 8, letterSpacing: ".04em" }}>
        SELECT DOCTOR <span style={{ fontWeight: 400, color: T.tm }}>(optional — affects wait prediction)</span>
      </div>

      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: T.inputBg, border: `1.5px solid ${open ? T.accent : T.border}`,
          borderRadius: T.rMd, padding: "11px 14px", cursor: "pointer",
          fontFamily: T.ff, textAlign: "left", display: "flex", alignItems: "center", gap: 10,
          boxShadow: open ? `0 0 0 3px ${T.accentLight}` : "none", transition: "all .15s",
        }}
      >
        {selected ? (
          <>
            <span style={{ fontSize: 18 }}>{SPECIALTY_ICONS[selected.specialty] ?? "🩺"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.tp }}>{selected.name}</div>
              <div style={{ fontSize: 11, color: T.ts }}>{selected.specialty} · {fmt12(selected.availStart)}–{fmt12(selected.availEnd)}</div>
            </div>
            {!isAvailNow(selected) && (
              <span style={{ fontSize: 10, background: T.redBg, color: T.red, border: `1px solid ${T.redBorder}`, borderRadius: 4, padding: "2px 7px", fontWeight: 600 }}>Unavailable now</span>
            )}
          </>
        ) : (
          <>
            <span style={{ fontSize: 16, color: T.tm }}>🩺</span>
            <span style={{ fontSize: 13, color: T.ts }}>Any available doctor</span>
          </>
        )}
        <span style={{ marginLeft: "auto", color: T.tm, fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rMd,
          boxShadow: T.shadowLg, marginTop: 4, overflow: "hidden",
        }}>
          {/* Any doctor option */}
          <div
            onClick={() => { onSelect(null); setOpen(false); }}
            style={{
              padding: "12px 14px", cursor: "pointer", borderBottom: `1px solid ${T.border}`,
              background: !selectedDoctor ? T.accentLight : "transparent",
              display: "flex", alignItems: "center", gap: 10, transition: "background .1s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = !selectedDoctor ? T.accentLight : T.cardHov}
            onMouseLeave={e => e.currentTarget.style.background = !selectedDoctor ? T.accentLight : "transparent"}
          >
            <span style={{ fontSize: 18 }}>🏥</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.tp }}>Any available doctor</div>
              <div style={{ fontSize: 11, color: T.ts }}>Use general hospital pattern</div>
            </div>
            {!selectedDoctor && <span style={{ marginLeft: "auto", color: T.accent, fontSize: 16 }}>✓</span>}
          </div>

          {doctors.map(d => {
            const avail = isAvailNow(d);
            const icon  = SPECIALTY_ICONS[d.specialty] ?? "🩺";
            return (
              <div key={d.id}
                onClick={() => { onSelect(d.id); setOpen(false); }}
                style={{
                  padding: "12px 14px", cursor: "pointer",
                  borderBottom: `1px solid ${T.border}`,
                  background: selectedDoctor === d.id ? T.accentLight : "transparent",
                  transition: "background .1s",
                  opacity: avail ? 1 : 0.7,
                }}
                onMouseEnter={e => e.currentTarget.style.background = selectedDoctor === d.id ? T.accentLight : T.cardHov}
                onMouseLeave={e => e.currentTarget.style.background = selectedDoctor === d.id ? T.accentLight : "transparent"}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 20, marginTop: 2 }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.tp }}>{d.name}</span>
                      {!avail && (
                        <span style={{ fontSize: 10, background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBorder}`, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
                          Available {fmt12(d.availStart)}–{fmt12(d.availEnd)}
                        </span>
                      )}
                      {avail && (
                        <span style={{ fontSize: 10, background: T.greenBg, color: T.green, border: `1px solid ${T.greenBorder}`, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
                          Available now
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: T.ts, marginBottom: 5 }}>
                      {d.specialty} · ~{d.avgConsultMin}min/patient · {fmt12(d.availStart)}–{fmt12(d.availEnd)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: T.tm, minWidth: 70 }}>Demand index</span>
                      <div style={{ flex: 1, maxWidth: 120 }}><PopularityBar value={d.popularityIndex} /></div>
                    </div>
                  </div>
                  {selectedDoctor === d.id && <span style={{ color: T.accent, fontSize: 16, flexShrink: 0 }}>✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
