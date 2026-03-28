import { useState } from "react";
import T from "../ui/tokens.js";
import SmartSearchBar from "../search/SmartSearchBar.jsx";
import { fmtDist, fmtDrive } from "../../utils/geo.js";
import CITIES from "../../data/cities.js";

function HospitalCard({ hosp, selected, isNearest, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "13px 14px", borderRadius: T.rMd, cursor: "pointer",
        transition: "all .18s",
        background: selected ? T.accentLight : hov ? T.cardHov : T.surface,
        border: `1.5px solid ${selected ? T.accent : hov ? T.borderMid : T.border}`,
        boxShadow: selected ? `0 0 0 3px ${T.accentBorder}` : hov ? T.shadow : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
            {isNearest && <span style={{ fontSize: 11 }}>👑</span>}
            <div style={{ fontSize: 13, fontWeight: 700, color: selected ? T.accentDark : T.tp, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {hosp.name}
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.ts }}>{hosp.area}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:2, alignItems:"flex-end", flexShrink:0, marginLeft:8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: hosp.badgeColor ?? T.accent,
            background: (hosp.badgeColor ?? T.accent) + "15",
            border: `1px solid ${(hosp.badgeColor ?? T.accent)}30`,
            borderRadius: 4, padding: "2px 7px",
          }}>{hosp.badge}</span>
          {hosp.isOSMOnly && (
            <span style={{ fontSize:9, color:T.ts, background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:3, padding:"1px 5px" }}>
              OSM
            </span>
          )}
        </div>
      </div>

      {hosp.distKm != null && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
          padding: "4px 8px", borderRadius: T.r,
          background: isNearest ? T.greenBg : T.accentLight,
          border: `1px solid ${isNearest ? T.greenBorder : T.accentBorder}`,
        }}>
          <span style={{ fontSize: 11 }}>📍</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: isNearest ? T.green : T.accent }}>
            {fmtDist(hosp.distKm)}
          </span>
          <span style={{ fontSize: 10, color: T.ts }}>· {fmtDrive(hosp.distKm)}</span>
          {isNearest && (
            <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: T.green }}>NEAREST</span>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: T.amber, fontWeight: 700 }}>★ {hosp.rating}</span>
        <span style={{ color: T.border }}>·</span>
        <span style={{ fontSize: 11, color: T.ts }}>{hosp.dailyVisits?.toLocaleString()}/day</span>
        <span style={{ color: T.border }}>·</span>
        <span style={{ fontSize: 10, color: T.tm }}>{hosp.type}</span>
      </div>
    </div>
  );
}

export default function Sidebar({ hospitals, nearestId, selectedId, onSelect, geo, cityId, setCityId, refCoords, cityHint, osmLoading, osmError, dataSource }) {
  return (
    <div style={{ padding: "18px 14px", borderRight: `1px solid ${T.border}`, minHeight: "calc(100vh - 62px)", background: T.surface }}>

      {/* City selector */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: T.tm, fontWeight: 700, letterSpacing: ".08em", marginBottom: 6 }}>REFERENCE CITY</div>
        <select value={cityId} onChange={e => setCityId(e.target.value)}
          style={{ width: "100%", background: T.inputBg, border: `1.5px solid ${T.border}`, color: T.tp, borderRadius: T.rMd, padding: "8px 12px", fontSize: 13, fontFamily: T.ff, cursor: "pointer", outline: "none" }}>
          {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* GPS Banner */}
      <div style={{ marginBottom: 12 }}>
        {geo.status === "idle" && (
          <button onClick={geo.request} style={{
            width: "100%", padding: "9px 12px", borderRadius: T.rMd, cursor: "pointer",
            background: T.accentLight, border: `1px solid ${T.accentBorder}`,
            fontFamily: T.ff, display: "flex", alignItems: "center", gap: 8, transition: "all .15s",
          }}>
            <span style={{ fontSize: 15 }}>📍</span>
            <div style={{ textAlign: "left", flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.accentDark }}>Use my exact location</div>
              <div style={{ fontSize: 10, color: T.ts }}>More accurate nearest sort</div>
            </div>
            <span style={{ fontSize: 11, color: T.accent, fontWeight: 600 }}>Enable →</span>
          </button>
        )}
        {geo.status === "requesting" && (
          <div style={{ padding: "9px 12px", borderRadius: T.rMd, background: T.amberBg, border: `1px solid ${T.amberBorder}`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>📡</span>
            <div style={{ fontSize: 12, color: T.amber, fontWeight: 600 }}>Requesting GPS…</div>
          </div>
        )}
        {geo.status === "granted" && (
          <div style={{ padding: "9px 12px", borderRadius: T.rMd, background: T.greenBg, border: `1px solid ${T.greenBorder}`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>✅</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.green }}>GPS active — sorted by distance</div>
              <div style={{ fontSize: 10, color: T.ts }}>{geo.coords?.lat.toFixed(4)}°N, {geo.coords?.lng.toFixed(4)}°E</div>
            </div>
            <button onClick={geo.request} style={{ fontSize: 10, color: T.ts, background: "transparent", border: `1px solid ${T.border}`, borderRadius: T.r, padding: "3px 8px", cursor: "pointer", fontFamily: T.ff }}>Refresh</button>
          </div>
        )}
        {(geo.status === "denied" || geo.status === "unavailable") && (
          <div style={{ padding: "9px 12px", borderRadius: T.rMd, background: T.amberBg, border: `1px solid ${T.amberBorder}`, display: "flex", gap: 8 }}>
            <span style={{ fontSize: 13, marginTop: 1 }}>ℹ️</span>
            <div>
              <div style={{ fontSize: 11, color: T.amber, fontWeight: 600, marginBottom: 2 }}>Using default location</div>
              <div style={{ fontSize: 10, color: T.ts, lineHeight: 1.5 }}>Enable location for better accuracy</div>
              <button onClick={geo.request} style={{ marginTop: 4, fontSize: 10, color: T.accent, background: "transparent", border: "none", cursor: "pointer", fontFamily: T.ff, padding: 0 }}>Try GPS again →</button>
            </div>
          </div>
        )}
      </div>

      {/* Smart Search */}
      <SmartSearchBar hospitals={hospitals} onSelect={onSelect} refCoords={refCoords} cityHint={cityHint} />

      {/* Section label + data source */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <div style={{ fontSize:10, color:T.tm, fontWeight:700, letterSpacing:".08em" }}>
          {geo.status === "granted" ? "NEAREST TO YOU" : "NEAREST HOSPITALS"} ({hospitals.length})
        </div>
        {osmLoading ? (
          <span style={{ fontSize:9, color:T.accent, fontWeight:600, display:"flex", alignItems:"center", gap:3 }}>
            <span style={{ animation:"pulse 1s infinite" }}>⟳</span> Loading live data…
          </span>
        ) : dataSource === "osm" ? (
          <span style={{ fontSize:9, color:T.green, fontWeight:600 }}>● Live (OSM)</span>
        ) : (
          <span style={{ fontSize:9, color:T.amber, fontWeight:600 }}>● Saved data</span>
        )}
      </div>

      {/* OSM error notice */}
      {osmError && (
        <div style={{ fontSize:10, color:T.amber, background:T.amberBg, border:`1px solid ${T.amberBorder}`, borderRadius:T.r, padding:"5px 10px", marginBottom:8 }}>
          ⚠️ {osmError}
        </div>
      )}

      {/* Hospital list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {hospitals.map(h => (
          <HospitalCard key={h.id} hosp={h} selected={h.id === selectedId}
            isNearest={h.id === nearestId}
            onClick={() => onSelect(h.id)} />
        ))}
      </div>
    </div>
  );
}
