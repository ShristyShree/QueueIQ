import T from "../ui/tokens.js";
import { Tag } from "../ui/Atoms.jsx";
import Sparkline from "../ui/Sparkline.jsx";
import HOSPITALS from "../../data/hospitals.js";
import { fmt12, DAYS } from "../../utils/time.js";

const card = (e={}) => ({ background:T.card,border:`1px solid ${T.border}`,borderRadius:T.rLg,padding:"18px 20px",boxShadow:T.shadow,...e });
const lbl  = { fontSize:10, color:T.tm, letterSpacing:".08em", fontWeight:700 };

export default function HistoryTab({ hospital, queueKey, result, feedback, fbInput, setFbInput, fbDone, learnedSvc, lsKey, onSubmit }) {
  const rel     = feedback.filter(f=>f.hospitalId===hospital?.id && f.queueKey===queueKey);
  const learned = learnedSvc[lsKey];

  return (
    <div style={{ animation:"fadeInUp .22s ease" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>

        {/* Feedback form */}
        <div style={{ ...card({ borderColor:T.purpleBorder }), background:T.purpleBg }}>
          <div style={{ ...lbl, marginBottom:4, color:T.purple }}>SELF-LEARNING ENGINE</div>
          <div style={{ fontSize:13, color:T.ts, marginBottom:16, lineHeight:1.65 }}>
            After visiting <strong style={{ color:T.tp }}>{hospital?.name}</strong>, report your actual wait time. QueueIQ recalibrates predictions for this hospital automatically.
          </div>

          {result && !result.closed && (
            <div style={{ padding:"10px 14px", background:T.surface, borderRadius:T.rMd, border:`1px solid ${T.border}`, marginBottom:14 }}>
              <div style={{ fontSize:12, color:T.tm }}>Current prediction:</div>
              <div style={{ fontSize:22, fontWeight:800, color:T.tp, marginTop:4 }}>
                {result.low}–{result.high} <span style={{ fontSize:14, fontWeight:400, color:T.ts }}>min</span>
              </div>
              <div style={{ fontSize:11, color:T.tm, marginTop:2 }}>{hospital?.name} · {hospital?.queues[queueKey]?.label}</div>
            </div>
          )}
          {result?.closed && (
            <div style={{ padding:"10px 14px", background:T.amberBg, borderRadius:T.rMd, border:`1px solid ${T.amberBorder}`, marginBottom:14 }}>
              <div style={{ fontSize:12, color:T.amber }}>⏰ Outside operating hours — feedback for past visits is still welcome.</div>
            </div>
          )}

          <div style={{ fontSize:12, color:T.ts, marginBottom:8 }}>How long did you actually wait?</div>
          <div style={{ display:"flex", gap:10 }}>
            <input type="number" placeholder="e.g. 32" value={fbInput} onChange={e=>setFbInput(e.target.value)}
              style={{ flex:1, background:T.surface, border:`1.5px solid ${T.border}`, color:T.tp, borderRadius:T.rMd, padding:"10px 14px", fontSize:16, fontFamily:T.ff, outline:"none" }}/>
            <button onClick={onSubmit} style={{
              padding:"10px 22px", borderRadius:T.rMd, border:"none", cursor:"pointer",
              background:fbDone?T.green:T.accent, color:"#fff", fontSize:14, fontWeight:700,
              fontFamily:T.ff, transition:"background .3s", minWidth:100, boxShadow:T.shadow,
            }}>{fbDone?"✓ Done!":"Submit"}</button>
          </div>

          {/* Calibration status */}
          <div style={{ marginTop:16, padding:"12px 14px", background:T.surface, borderRadius:T.rMd, border:`1px solid ${T.border}` }}>
            <div style={{ ...lbl, marginBottom:8 }}>CALIBRATION — {hospital?.name} · {hospital?.queues[queueKey]?.label}</div>
            {rel.length === 0 ? (
              <div style={{ fontSize:12, color:T.tm }}>No feedback yet. Submit your first report above.</div>
            ):(
              <>
                <div style={{ display:"flex", gap:20, marginBottom:10 }}>
                  <div><div style={{ fontSize:20, fontWeight:800, color:T.teal }}>{rel.length}</div><div style={{ fontSize:10, color:T.tm }}>reports</div></div>
                  <div><div style={{ fontSize:20, fontWeight:800, color:T.accent }}>{Math.abs(Math.round(rel.reduce((s,f)=>s+(f.actual-f.predicted),0)/rel.length))}m</div><div style={{ fontSize:10, color:T.tm }}>avg error</div></div>
                  {learned&&<div><div style={{ fontSize:20, fontWeight:800, color:T.purple }}>{learned}m</div><div style={{ fontSize:10, color:T.tm }}>learned svc time</div></div>}
                </div>
                <div style={{ height:5, background:T.border, borderRadius:3 }}>
                  <div style={{ height:"100%", width:`${Math.min(100,rel.length*10)}%`, background:T.teal, borderRadius:3, transition:"width .5s" }}/>
                </div>
                <div style={{ fontSize:10, color:T.tm, marginTop:5 }}>{Math.min(100,rel.length*10)}% calibrated for {hospital?.shortName}</div>
              </>
            )}
          </div>
        </div>

        {/* Log */}
        <div style={card()}>
          <div style={{ ...lbl, marginBottom:14 }}>FEEDBACK LOG — ALL HOSPITALS</div>
          {feedback.length===0?(
            <div style={{ textAlign:"center", padding:"40px 0", color:T.tm }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
              No feedback submitted yet
            </div>
          ):(
            <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:340, overflowY:"auto" }}>
              {feedback.slice().reverse().map((f,i)=>{
                const diff = f.actual-f.predicted;
                const h    = HOSPITALS.find(x=>x.id===f.hospitalId);
                const ql   = h?.queues[f.queueKey]?.label||f.queueKey;
                return (
                  <div key={i} style={{ padding:"11px 14px", background:T.inputBg, borderRadius:T.rMd, border:`1px solid ${T.border}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <div>
                        <span style={{ fontSize:13, fontWeight:700, color:T.tp }}>{h?.name}</span>
                        <span style={{ fontSize:11, color:T.tm, marginLeft:8 }}>{ql}</span>
                      </div>
                      <span style={{ fontSize:11, color:T.tm }}>{fmt12(f.hour)}, {DAYS[f.day]}</span>
                    </div>
                    <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                      <span style={{ fontSize:12, color:T.ts }}>Pred: <strong style={{ color:T.tp }}>{f.predicted}m</strong></span>
                      <span style={{ fontSize:12, color:T.ts }}>Actual: <strong style={{ color:T.tp }}>{f.actual}m</strong></span>
                      <span style={{ fontSize:13, fontWeight:700, color:Math.abs(diff)<5?T.green:Math.abs(diff)<12?T.amber:T.red }}>
                        {diff>0?"+":""}{diff}m
                      </span>
                      <Tag color={Math.abs(diff)<5?T.green:Math.abs(diff)<12?T.amber:T.red} bg={Math.abs(diff)<5?T.greenBg:Math.abs(diff)<12?T.amberBg:T.redBg}>
                        {Math.abs(diff)<5?"accurate":Math.abs(diff)<12?"close":"off"}
                      </Tag>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {feedback.length>1&&(
        <div style={card()}>
          <div style={{ ...lbl, marginBottom:12 }}>MODEL ACCURACY IMPROVEMENT OVER TIME</div>
          <div style={{ height:60 }}>
            <Sparkline data={feedback.map((f,i)=>({hour:i,value:Math.abs(f.actual-f.predicted)}))} color={T.purple} height={60} nowHour={feedback.length-1}/>
          </div>
          <div style={{ fontSize:11, color:T.ts, marginTop:8 }}>Error per submission (minutes) — lower is better. Model recalibrates per hospital automatically.</div>
        </div>
      )}
    </div>
  );
}
