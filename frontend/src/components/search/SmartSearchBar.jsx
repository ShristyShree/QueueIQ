/**
 * SmartSearchBar v4
 * =================
 * - Geocodes unknown hospital queries via OpenStreetMap Nominatim
 * - Shows real GPS distance for search results
 * - Reliable click handling with pickingRef pattern
 * - Divider between search result and nearby hospitals
 */

import { useState, useRef, useEffect, useCallback } from "react";
import T from "../ui/tokens.js";
import useSmartSearch, { highlightRanges } from "../../hooks/useSmartSearch.js";
import useGeocode from "../../hooks/useGeocode.js";
import { fmtDist } from "../../utils/geo.js";

function HighlightText({ text, ranges }) {
  if (!ranges || !ranges.length) return <span>{text}</span>;
  const parts = [];
  let last = 0;
  for (const [s, e] of ranges) {
    if (s > last) parts.push(<span key={`p${s}`}>{text.slice(last, s)}</span>);
    parts.push(
      <mark key={`h${s}`} style={{ background:"#DBEAFE", color:"#1D4ED8", borderRadius:2, padding:"0 1px" }}>
        {text.slice(s, e)}
      </mark>
    );
    last = e;
  }
  if (last < text.length) parts.push(<span key="tail">{text.slice(last)}</span>);
  return <>{parts}</>;
}

const TAG_COLORS = {
  "Best match":    { bg:"#DBEAFE", color:"#1D4ED8" },
  "Nearby":        { bg:"#D1FAE5", color:"#065F46" },
  "Top rated":     { bg:"#FEF3C7", color:"#92400E" },
  "Search result": { bg:"#EDE9FE", color:"#5B21B6" },
};

export default function SmartSearchBar({ hospitals, onSelect, refCoords, cityHint }) {
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef   = useRef(null);
  const pickingRef = useRef(false);

  // Geocode the typed query to get real coords for unknown hospitals
  const [geocodeQuery, setGeocodeQuery] = useState("");
  const { coords: geocodedCoords, area: geocodedArea, loading: geocoding } =
    useGeocode(geocodeQuery, cityHint ?? "Chennai");

  const {
    query, setQuery, suggestions, isOpen, setFocused, clear,
  } = useSmartSearch(hospitals, refCoords, geocodedCoords, geocodedArea);

  // Only geocode when there are no real matches (debounced 600ms to avoid spamming)
  const geocodeTimer = useRef(null);
  useEffect(() => {
    const q = query.trim();
    const hasRealMatch = suggestions.some(s => !s.isSynthetic);
    clearTimeout(geocodeTimer.current);

    if (q && !hasRealMatch) {
      geocodeTimer.current = setTimeout(() => setGeocodeQuery(q), 600);
    } else {
      setGeocodeQuery("");
    }
    return () => clearTimeout(geocodeTimer.current);
  }, [query, suggestions]);

  useEffect(() => { setActiveIdx(-1); }, [suggestions]);

  const pick = useCallback((suggestion) => {
    pickingRef.current = false;
    // If synthetic and geocode just resolved, update coords before selecting
    if (suggestion.isSynthetic && geocodedCoords) {
      onSelect({ ...suggestion, coords: geocodedCoords, area: geocodedArea ?? suggestion.area });
    } else {
      onSelect(suggestion);
    }
    clear();
    setFocused(false);
  }, [onSelect, clear, setFocused, geocodedCoords, geocodedArea]);

  const handleKey = (e) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i+1, suggestions.length-1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i-1, -1)); }
    else if (e.key === "Enter" && activeIdx >= 0 && suggestions[activeIdx]) { e.preventDefault(); pick(suggestions[activeIdx]); }
    else if (e.key === "Escape") { clear(); setFocused(false); inputRef.current?.blur(); }
  };

  const handleBlur = () => {
    setTimeout(() => { if (!pickingRef.current) setFocused(false); }, 150);
  };

  const hasSynthetic = suggestions.length > 0 && suggestions[0].isSynthetic;
  const firstRealIdx = suggestions.findIndex(s => !s.isSynthetic);

  return (
    <div style={{ position:"relative", marginBottom:12 }}>
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:15, color:T.tm, pointerEvents:"none" }}>🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKey}
          placeholder="Search hospitals, doctors, specialties…"
          autoComplete="off"
          style={{
            width:"100%", background:T.inputBg,
            border:`1.5px solid ${isOpen ? T.accent : T.border}`,
            borderRadius:T.rMd, padding:"10px 36px 10px 38px",
            fontSize:14, fontFamily:T.ff, color:T.tp,
            outline:"none", transition:"border-color .15s, box-shadow .15s",
            boxShadow: isOpen ? `0 0 0 3px ${T.accentLight}` : "none",
          }}
        />
        {query && (
          <button onClick={() => { clear(); setGeocodeQuery(""); inputRef.current?.focus(); }}
            style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:T.tm, fontSize:20, lineHeight:1, padding:"2px 4px" }}>
            ×
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0, right:0,
          background:T.card, borderRadius:T.rMd,
          border:`1px solid ${T.border}`, boxShadow:T.shadowLg,
          zIndex:300, overflow:"hidden", maxHeight:440, overflowY:"auto",
        }}>
          {suggestions.map((h, i) => {
            const isSynth  = !!h.isSynthetic;
            const isActive = i === activeIdx;
            const showDivider = hasSynthetic && i === firstRealIdx && firstRealIdx > 0;

            return (
              <div key={h.id}>
                {showDivider && (
                  <div style={{ padding:"5px 14px", fontSize:10, fontWeight:700, letterSpacing:".08em", color:T.tm, background:T.inputBg, borderBottom:`1px solid ${T.border}`, borderTop:`1px solid ${T.border}` }}>
                    NEARBY HOSPITALS
                  </div>
                )}
                <div
                  onPointerDown={() => { pickingRef.current = true; }}
                  onClick={() => pick(h)}
                  onMouseEnter={() => setActiveIdx(i)}
                  style={{
                    padding:"11px 14px", cursor:"pointer",
                    background: isActive ? T.accentLight : isSynth ? "#F5F3FF" : "transparent",
                    borderBottom: i < suggestions.length-1 ? `1px solid ${T.border}` : "none",
                    display:"flex", alignItems:"flex-start", gap:10,
                    transition:"background .1s",
                  }}
                >
                  <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>
                    {isSynth ? "🔍" : "🏥"}
                  </span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:isSynth?"#5B21B6":T.tp, marginBottom:2 }}>
                      <HighlightText text={h.name} ranges={h.nameRanges ?? []} />
                    </div>
                    <div style={{ fontSize:11, color:T.ts }}>
                      {isSynth && geocodedArea
                        ? geocodedArea.split(",").slice(0,2).join(",")
                        : <HighlightText text={h.area ?? ""} ranges={h.areaRanges ?? []} />
                      }
                      {isSynth && geocoding && <span style={{ color:T.tm }}> · locating…</span>}
                      {isSynth && !geocoding && geocodedCoords && refCoords && (
                        <span style={{ color:T.accent, fontWeight:600 }}>
                          {" · "}{fmtDist(
                            (() => {
                              const R = 6371, toRad = x => x * Math.PI / 180;
                              const dLat = toRad(geocodedCoords.lat - refCoords.lat);
                              const dLng = toRad(geocodedCoords.lng - refCoords.lng);
                              const a = Math.sin(dLat/2)**2
                                + Math.cos(toRad(refCoords.lat)) * Math.cos(toRad(geocodedCoords.lat)) * Math.sin(dLng/2)**2;
                              return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                            })()
                          )}
                        </span>
                      )}
                      {!isSynth && h.distKm != null && <span style={{ color:T.tm }}> · {fmtDist(h.distKm)}</span>}
                    </div>
                    {isSynth && (
                      <div style={{ fontSize:11, color:"#7C3AED", marginTop:3, fontStyle:"italic" }}>
                        {geocoding ? "Finding location…" : "Not in our dataset — tap to use with estimated predictions"}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:4, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end" }}>
                    {(h.tags ?? []).map(tag => (
                      <span key={tag} style={{ fontSize:10, fontWeight:600, padding:"2px 6px", borderRadius:4, background:TAG_COLORS[tag]?.bg??"#F1F5F9", color:TAG_COLORS[tag]?.color??T.ts }}>{tag}</span>
                    ))}
                    {!isSynth && h.rating != null && (
                      <span style={{ fontSize:11, color:"#D97706", fontWeight:600 }}>★ {h.rating}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
