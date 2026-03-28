import T from "../ui/tokens.js";
import { AN, CrowdBadge } from "../ui/Atoms.jsx";
import Sparkline from "../ui/Sparkline.jsx";
import QUEUE_HOURS from "../../data/queueHours.js";
import { fmt12, DAYS } from "../../utils/time.js";

const card = (e={}) => ({ background:T.card,border:`1px solid ${T.border}`,borderRadius:T.rLg,padding:"18px 20px",boxShadow:T.shadow,...e });
const lbl  = { fontSize:10, color:T.tm, letterSpacing:".08em", fontWeight:700 };

export default function SimulatorTab({ hospital, queueKey, simHour, setSimHour, simDay, setSimDay, simResult, simProfile }) {
  if (!hospital || !simResult) return null;
  const hrs = QUEUE_HOURS[queueKey];

  return (
    <div style={{ animation:"fadeInUp .22s ease" }}>
      <div style={{ ...card({ borderColor:T.accentBorder, background:T.accentLight }), marginBottom:14 }}>
        <div style={{ fontSize:10, color:T.accent, letterSpacing:".08em", fontWeight:700, marginBottom:3 }}>WHAT-IF SIMULATOR</div>
        <div style={{ fontSize:13, color:T.ts }}>
          Drag sliders to instantly see how wait time changes at <strong style={{ color:T.tp }}>{hospital.name}</strong>. No visit needed.
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <div style={card()}>
          <div style={{ ...lbl, marginBottom:12 }}>SIMULATE HOUR</div>
          <input type="range" min="0" max="23" value={simHour}
            style={{ "--pct":`${(simHour/23)*100}%`,"--clr":T.teal, width:"100%", marginBottom:12 }}
            onChange={e=>setSimHour(+e.target.value)}/>
          <div style={{ textAlign:"center", fontSize:34, fontWeight:800, color:T.teal, letterSpacing:"-0.04em" }}>
            {fmt12(simHour)}
          </div>
        </div>
        <div style={card()}>
          <div style={{ ...lbl, marginBottom:12 }}>SIMULATE DAY</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
            {DAYS.map((d,i)=>(
              <button key={i} onClick={()=>setSimDay(i)} style={{
                padding:"7px 0", borderRadius:T.r, cursor:"pointer", fontFamily:T.ff, fontSize:12,
                border:`1.5px solid ${simDay===i?T.accent:T.border}`,
                background:simDay===i?T.accentLight:"transparent",
                color:simDay===i?T.accent:T.ts, fontWeight:simDay===i?700:400,
              }}>{d}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:12, marginBottom:12 }}>
        <div style={{ ...card({ borderColor:simResult.closed?T.amberBorder:T.accentBorder }) }}>
          <div style={{ ...lbl, marginBottom:10 }}>SIMULATED WAIT — {fmt12(simHour)}, {DAYS[simDay]} · {hospital.shortName}</div>
          {simResult.closed ? (
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:T.amber, marginBottom:6 }}>⏰ Service unavailable at {fmt12(simHour)}</div>
              <div style={{ fontSize:13, color:T.ts, marginBottom:10 }}>{simResult.suggestion}</div>
              <button onClick={()=>setSimHour(simResult.nextBestHour)} style={{ padding:"7px 14px", borderRadius:T.rMd, border:`1px solid ${T.accentBorder}`, background:T.accentLight, color:T.accent, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.ff }}>
                Jump to {fmt12(simResult.nextBestHour)} →
              </button>
            </div>
          ):(
            <>
              <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                <AN value={simResult.low}  color={T.tp}   size={46}/>
                <span style={{ fontSize:16, color:T.tm }}>–</span>
                <AN value={simResult.high} color={T.teal} size={46}/>
                <span style={{ fontSize:14, color:T.ts, marginLeft:4 }}>min</span>
              </div>
              <div style={{ marginTop:10, display:"flex", gap:10 }}>
                <CrowdBadge level={simResult.crowd}/>
                <span style={{ fontSize:12, color:T.ts }}>Confidence: <strong style={{ color:T.tp }}>{simResult.confidence}%</strong></span>
              </div>
            </>
          )}
        </div>

        <div style={{ ...card({ borderColor:T.greenBorder, background:T.greenBg }) }}>
          <div style={{ fontSize:10, color:T.green, letterSpacing:".08em", fontWeight:700, marginBottom:8 }}>BEST WINDOW</div>
          {simResult.closed ? <div style={{ fontSize:13, color:T.ts }}>—</div> : (
            <>
              <div style={{ fontSize:26, fontWeight:800, color:T.green }}>{fmt12(simResult.bestHour)}</div>
              <div style={{ fontSize:12, color:T.ts, marginTop:4 }}>~{simResult.bestVal} min wait</div>
              <div style={{ fontSize:10, color:T.tm, marginTop:3 }}>{hrs?.label ?? "operating hours"}</div>
            </>
          )}
        </div>

        <div style={{ ...card({ borderColor:T.redBorder, background:T.redBg }) }}>
          <div style={{ fontSize:10, color:T.red, letterSpacing:".08em", fontWeight:700, marginBottom:8 }}>AVOID</div>
          {simResult.closed ? <div style={{ fontSize:13, color:T.ts }}>—</div> : (
            <>
              <div style={{ fontSize:26, fontWeight:800, color:T.red }}>{fmt12(simResult.worstHour)}</div>
              <div style={{ fontSize:12, color:T.ts, marginTop:4 }}>~{simResult.worstVal} min wait</div>
            </>
          )}
        </div>
      </div>

      {/* Full day grid */}
      <div style={card()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={lbl}>FULL DAY VIEW — {DAYS[simDay]} · {hospital.name}</div>
          {hrs && <div style={{ fontSize:11, color:T.ts }}>Operating: <span style={{ color:T.green, fontWeight:600 }}>{hrs.label}</span> · Greyed = closed</div>}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:5 }}>
          {simProfile.filter(d=>d.hour>=6&&d.hour<=22).map(d=>{
            const inact  = d.inactive;
            const ity    = d.value / Math.max(...simProfile.map(x=>x.value),1);
            const bg     = ity<.28?T.green:ity<.62?T.amber:T.red;
            const isSel  = d.hour===simHour;
            const isBest = !simResult.closed && d.hour===simResult.bestHour;
            const isWrst = !simResult.closed && d.hour===simResult.worstHour;
            return (
              <div key={d.hour} onClick={()=>setSimHour(d.hour)}
                style={{
                  padding:"9px 6px", borderRadius:T.rMd, textAlign:"center", cursor:"pointer", transition:"all .15s",
                  opacity:inact?0.35:1,
                  background:isSel?(inact?"#F1F5F9":bg+"25"):T.inputBg,
                  border:`1.5px solid ${isSel?(inact?T.borderMid:bg):isBest?T.green:isWrst?T.red:T.border}`,
                  boxShadow: isSel?T.shadow:"none",
                }}>
                <div style={{ fontSize:10, color:inact?T.ti:T.ts, marginBottom:2 }}>{fmt12(d.hour)}</div>
                {inact?<div style={{ fontSize:12, color:T.ti }}>—</div>:<>
                  <div style={{ fontSize:14, fontWeight:700, color:bg }}>{d.value}</div>
                  <div style={{ fontSize:9, color:T.tm }}>min</div>
                </>}
                {isBest&&<div style={{ fontSize:8, color:T.green, fontWeight:700, marginTop:2 }}>BEST</div>}
                {isWrst&&<div style={{ fontSize:8, color:T.red,   fontWeight:700, marginTop:2 }}>PEAK</div>}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:14, height:52 }}>
          <Sparkline data={simProfile} color={T.teal} height={52} nowHour={simHour}/>
        </div>
      </div>
    </div>
  );
}
