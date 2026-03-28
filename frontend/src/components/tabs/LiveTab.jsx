import T from "../ui/tokens.js";
import { AN, CrowdBadge, ConfRing, Shimmer } from "../ui/Atoms.jsx";
import Sparkline from "../ui/Sparkline.jsx";
import DoctorSelector from "../doctors/DoctorSelector.jsx";
import QUEUE_HOURS from "../../data/queueHours.js";
import { fmt12, DAYS } from "../../utils/time.js";

const card = (extra = {}) => ({
  background: T.card, border: `1px solid ${T.border}`,
  borderRadius: T.rLg, padding: "18px 20px",
  boxShadow: T.shadow, ...extra,
});

const lbl = { fontSize: 10, color: T.tm, letterSpacing: ".08em", fontWeight: 700 };
const sel = () => ({ width: "100%", background: T.inputBg, border: `1.5px solid ${T.border}`, color: T.tp, borderRadius: T.rMd, padding: "9px 12px", fontSize: 14, fontFamily: T.ff, cursor: "pointer", outline: "none" });

function OutsideHoursCard({ result, hour, setHour }) {
  const isDoctorUnavail = result.reason === "doctor_unavailable";
  return (
    <div style={{ ...card({ borderColor: T.amberBorder }), background: T.amberBg, marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 44, height: 44, borderRadius: T.rMd, background: "#FEF3C7", border: `1px solid ${T.amberBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>⏰</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.amber, marginBottom: 4 }}>
            {isDoctorUnavail ? `${result.doctorName} is not available at ${fmt12(hour)}` : `Service likely unavailable at ${fmt12(hour)}`}
          </div>
          <div style={{ fontSize: 13, color: T.ts, marginBottom: 10, lineHeight: 1.6 }}>
            {isDoctorUnavail
              ? <>{result.doctorName} ({result.specialty}) is available <strong style={{ color: T.tp }}>{fmt12(result.availStart)}–{fmt12(result.availEnd)}</strong>. Select a time within that window.</>
              : <>This queue operates <strong style={{ color: T.tp }}>{result.hoursLabel}</strong>. No reliable prediction can be made outside this window.</>
            }
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ padding: "8px 14px", borderRadius: T.rMd, background: T.greenBg, border: `1px solid ${T.greenBorder}`, fontSize: 13, color: T.green, fontWeight: 500 }}>
              ✅ {result.suggestion}
            </div>
            <button onClick={() => setHour(result.nextBestHour)} style={{
              padding: "8px 14px", borderRadius: T.rMd, border: `1px solid ${T.accentBorder}`,
              background: T.accentLight, color: T.accent, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: T.ff,
            }}>
              Jump to {fmt12(result.nextBestHour)} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveTab({
  hospital, queueKey, hour, setHour, day, setDay, people, setPeople,
  result, profile, loading, selectedDoctor, setSelectedDoctor,
}) {
  if (!result && !loading) return null;
  const maxP = Math.max(...(profile || []).map(d => d.value), 1);
  const hrs  = QUEUE_HOURS[queueKey];

  return (
    <div style={{ animation: "fadeInUp .22s ease" }}>

      {/* Context row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12, marginBottom: 14 }}>
        <div style={card()}>
          <div style={{ ...lbl, marginBottom: 8 }}>TIME</div>
          <select value={hour} onChange={e => setHour(+e.target.value)} style={sel()}>
            {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{fmt12(h)}</option>)}
          </select>
        </div>
        <div style={card()}>
          <div style={{ ...lbl, marginBottom: 8 }}>DAY</div>
          <select value={day} onChange={e => setDay(+e.target.value)} style={sel()}>
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div style={card()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={lbl}>PEOPLE AHEAD</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.accentLight, border: `1px solid ${T.accentBorder}`, borderRadius: T.r, padding: "4px 12px" }}>
              <span style={{ fontSize: 12 }}>👥</span>
              <span style={{ fontSize: 19, fontWeight: 800, color: T.accent, fontFamily: T.ff }}>{people}</span>
            </div>
          </div>
          <input type="range" min="0" max="30" value={people}
            style={{ "--pct": `${(people/30)*100}%`, "--clr": T.accent, width: "100%", marginBottom: 6 }}
            onChange={e => setPeople(+e.target.value)} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {["0 — empty", "~10", "~20", "30 — packed"].map(s => <span key={s} style={{ fontSize: 10, color: T.tm }}>{s}</span>)}
          </div>
        </div>
      </div>

      {/* Doctor selector (only for doctor queue) */}
      {queueKey === "doctor" && hospital?.doctors?.length > 0 && (
        <DoctorSelector
          hospital={hospital}
          currentHour={hour}
          selectedDoctor={selectedDoctor}
          onSelect={setSelectedDoctor}
        />
      )}

      {/* Loading shimmer */}
      {loading && (
        <div style={{ ...card(), marginBottom: 12 }}>
          <Shimmer height={24} width="60%" radius={6} />
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <Shimmer height={64} width="45%" radius={8} />
            <Shimmer height={64} width="45%" radius={8} />
          </div>
        </div>
      )}

      {/* OSM-only hospital banner */}
      {!loading && result?.isOSMOnly && !result?.isSynthetic && !result?.closed && (
        <div style={{
          ...card({ borderColor:T.tealBorder, background:T.tealBg }),
          marginBottom:14, display:"flex", gap:12, alignItems:"flex-start",
        }}>
          <span style={{ fontSize:20, flexShrink:0 }}>🗺️</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.teal, marginBottom:3 }}>
              Real hospital · Limited historical data
            </div>
            <div style={{ fontSize:12, color:T.ts, lineHeight:1.6 }}>
              <strong style={{ color:T.tp }}>{hospital?.name}</strong> was found via OpenStreetMap.
              Predictions use <strong>typical city averages</strong> — submit feedback after your visit to improve accuracy.
            </div>
          </div>
        </div>
      )}

      {/* Estimated data banner for synthetic hospitals */}
      {!loading && result?.isSynthetic && !result?.closed && (
        <div style={{
          ...card({ borderColor:"#DDD6FE", background:"#F5F3FF" }),
          marginBottom: 14, display:"flex", gap:12, alignItems:"flex-start",
        }}>
          <span style={{ fontSize:22, flexShrink:0 }}>🔍</span>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#5B21B6", marginBottom:4 }}>
              Estimated predictions — hospital not in our dataset
            </div>
            <div style={{ fontSize:13, color:T.ts, lineHeight:1.6 }}>
              <strong style={{ color:T.tp }}>{hospital?.name}</strong> is not in QueueIQ's
              dataset yet. Predictions are based on <strong>typical Chennai hospital averages</strong> and
              may not reflect actual conditions.
            </div>
          </div>
        </div>
      )}

      {/* Outside hours / doctor unavailable */}
      {!loading && result?.closed && (
        <OutsideHoursCard result={result} hour={hour} setHour={setHour} />
      )}

      {/* Normal prediction */}
      {!loading && result && !result.closed && (
        <>
          {/* Big prediction card */}
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 12, marginBottom: 12 }}>
            <div style={{ ...card({ border: `1.5px solid ${T.accentBorder}` }), position: "relative", overflow: "hidden" }}>
              {/* Soft blue accent in top-right */}
              <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: T.accentLight, borderRadius: "50%", pointerEvents: "none" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ ...lbl, marginBottom: 4 }}>
                    PREDICTED WAIT — {hospital?.shortName} · {hospital?.queues[queueKey]?.label}
                    {result.doctor && <span style={{ color: T.accent, fontWeight: 700 }}> · {result.doctor.name}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <AN value={result.low}  color={T.tp}      size={56}/>
                    <span style={{ fontSize: 20, color: T.tm, fontWeight: 300 }}>–</span>
                    <AN value={result.high} color={T.accent}  size={56}/>
                    <span style={{ fontSize: 18, color: T.ts, marginLeft: 4 }}>min</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 14, color: T.ts }}>
                    Most likely: <strong style={{ color: T.tp }}>{result.combined} min</strong>
                    <span style={{ marginLeft: 10, fontSize: 12, color: T.tm }}>± {result.sigma} min</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <ConfRing value={result.confidence}/>
                  <div style={{ fontSize: 10, color: T.tm, textAlign: "center" }}>confidence</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <CrowdBadge level={result.crowd}/>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: T.green, background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 20, padding: "4px 10px" }}>
                  ✅ Best: <strong style={{ marginLeft: 3 }}>{result.bestHourLabel}</strong>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: T.red, background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 20, padding: "4px 10px" }}>
                  ⚠️ Avoid: <strong style={{ marginLeft: 3 }}>{fmt12(result.worstHour)}</strong>
                </span>
              </div>

              {/* Doctor-level realism stats */}
              {result.doctor && (
                <div style={{ padding: "10px 12px", background: T.purpleBg, border: `1px solid ${T.purpleBorder}`, borderRadius: T.rMd, marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    <div><div style={{ fontSize: 11, fontWeight: 700, color: T.purple }}>{result.doctor.name}</div><div style={{ fontSize: 10, color: T.ts }}>{result.doctor.specialty}</div></div>
                    <div><div style={{ fontSize: 11, fontWeight: 700, color: T.tp }}>~{result.doctor.avgConsultMin} min/patient</div><div style={{ fontSize: 10, color: T.ts }}>avg consultation</div></div>
                    <div><div style={{ fontSize: 11, fontWeight: 700, color: T.tp }}>{result.doctor.popularityIndex}/100</div><div style={{ fontSize: 10, color: T.ts }}>popularity index</div></div>
                    <div><div style={{ fontSize: 11, fontWeight: 700, color: T.tp }}>{fmt12(result.doctor.availStart)}–{fmt12(result.doctor.availEnd)}</div><div style={{ fontSize: 10, color: T.ts }}>available today</div></div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 11, color: T.ts }}>🕑 Updated {hospital?.lastUpdated}</span>
                <span style={{ fontSize: 11, color: T.ts }}>👁 {hospital?.liveUsers} viewing</span>
                <span style={{ fontSize: 11, color: T.ts }}>📊 Based on {result.avgVisitsData?.toLocaleString()}+ visits</span>
                <span style={{ fontSize: 11, color: T.ts }}>🎯 Accuracy ±{Math.round((100-(hospital?.queues[queueKey]?.modelAccuracy??85))*1.2+4)}min avg</span>
                {hrs && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>🟢 {hrs.label}</span>}
              </div>
            </div>

            {/* Right col */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Weight bars */}
              <div style={card()}>
                <div style={{ ...lbl, marginBottom: 12 }}>PREDICTION WEIGHTS</div>
                {[
                  { label: "Historical model", val: result.modelPrediction, w: result.modelWeight, color: T.accent },
                  { label: "Live queue input",  val: result.livePrediction,  w: result.liveWeight,  color: T.teal  },
                ].map(({ label, val, w, color }) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: T.ts }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{val}min · {w}%</span>
                    </div>
                    <div style={{ height: 5, background: T.inputBg, borderRadius: 3, border: `1px solid ${T.border}` }}>
                      <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 3, transition: "width .5s cubic-bezier(.4,0,.2,1)" }}/>
                    </div>
                  </div>
                ))}
                {result.feedbackCount >= 2 && (
                  <div style={{ padding: "6px 10px", background: T.tealBg, borderRadius: T.r, border: `1px solid ${T.tealBorder}`, fontSize: 11, color: T.teal }}>
                    ✦ Self-tuned from {result.feedbackCount} visits at {hospital?.shortName}
                  </div>
                )}
              </div>

              {/* Explainability */}
              <div style={{ ...card(), flex: 1 }}>
                <div style={{ ...lbl, marginBottom: 12 }}>WHY THIS PREDICTION?</div>
                {result.explanations.map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.accent, marginTop: 5, flexShrink: 0 }}/>
                    <span style={{ fontSize: 12, color: T.ts, lineHeight: 1.6 }}>{e}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ ...card(), marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={lbl}>CROWD TIMELINE — {DAYS[day]} at {hospital?.shortName}</div>
                <div style={{ fontSize: 12, color: T.ts, marginTop: 3 }}>Expected {hospital?.queues[queueKey]?.label} load</div>
              </div>
              <div style={{ fontSize: 12, color: T.ts }}>Now: <strong style={{ color: T.accent }}>{fmt12(hour)}</strong></div>
            </div>
            <div style={{ height: 64 }}>
              <Sparkline data={profile} color={T.accent} height={64} nowHour={hour}/>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              {[0,3,6,9,12,15,18,21,23].map(h => (
                <span key={h} style={{ fontSize: 10, color: h===hour ? T.accent : T.tm, fontWeight: h===hour ? 700 : 400 }}>{fmt12(h)}</span>
              ))}
            </div>
          </div>

          {/* Heatmap */}
          <div style={{ ...card(), marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={lbl}>HOURLY HEATMAP — click any cell to jump</div>
              {hrs && <div style={{ fontSize: 11, color: T.ts }}>Shaded = outside {hrs.label}</div>}
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              {profile.map((d, h) => {
                const ity   = d.value / maxP;
                const bg    = ity < .28 ? T.green : ity < .62 ? T.amber : T.red;
                const inact = d.inactive;
                const isBest  = h === result.bestHour, isWorst = h === result.worstHour, isNow = h === hour;
                return (
                  <div key={h} title={inact ? `${fmt12(h)}: outside hours` : `${fmt12(h)}: ~${d.value}min`}
                    onClick={() => setHour(h)}
                    style={{
                      flex: 1, height: 38, borderRadius: 5, cursor: "pointer",
                      background: inact ? T.border : bg,
                      opacity: inact ? 0.3 : .12 + ity * .88,
                      border: `2px solid ${isNow ? T.accent : isBest&&!inact ? T.green : isWorst&&!inact ? T.red : "transparent"}`,
                      position: "relative", transition: "opacity .15s",
                    }}>
                    {(isBest||isWorst||isNow)&&!inact && (
                      <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 8, fontWeight: 700, whiteSpace: "nowrap", color: isNow?T.accent:isBest?T.green:T.red }}>
                        {isNow?"▼":isBest?"BEST":"PEAK"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
              {profile.map((_, h) => <div key={h} style={{ flex: 1, textAlign: "center", fontSize: 9, color: h===hour?T.accent:T.ti }}>{h%4===0?fmt12(h):""}</div>)}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
              {[{c:T.green,l:"Best time"},{c:T.amber,l:"Medium"},{c:T.red,l:"Peak / avoid"}].map(({c,l})=>(
                <div key={l} style={{ display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.ts }}>
                  <div style={{ width:10,height:10,borderRadius:2,background:c }}/>{l}
                </div>
              ))}
            </div>
          </div>

          {/* Hospital insights */}
          {result.notes?.length > 0 && (
            <div style={{ ...card({ borderColor: T.purpleBorder, background: T.purpleBg }) }}>
              <div style={{ ...lbl, marginBottom: 10, color: T.purple }}>LOCATION INSIGHTS — {hospital?.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {result.notes.map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "9px 12px", background: T.surface, borderRadius: T.rMd, border: `1px solid ${T.purpleBorder}` }}>
                    <span style={{ color: T.purple, flexShrink: 0 }}>💡</span>
                    <span style={{ fontSize: 12, color: T.ts, lineHeight: 1.55 }}>{n}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
