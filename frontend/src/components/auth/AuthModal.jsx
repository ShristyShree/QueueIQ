import { useState } from "react";
import T from "../ui/tokens.js";

export default function AuthModal({ onClose, auth }) {
  const [mode, setMode]         = useState("login");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSub]    = useState(false);

  const submit = async () => {
    setSub(true);
    const r = mode==="login"
      ? await auth.login(email, password)
      : await auth.register(name, email, password);
    setSub(false);
    if (r.success) onClose();
  };

  const inp = (extra={}) => ({
    width:"100%", background:T.inputBg, border:`1.5px solid ${T.border}`,
    color:T.tp, borderRadius:T.rMd, padding:"11px 14px",
    fontSize:14, fontFamily:T.ff, marginBottom:12, display:"block", outline:"none", ...extra,
  });

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(15,23,42,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300 }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:T.card, border:`1px solid ${T.border}`, borderRadius:T.rXl,
        padding:"32px 36px", width:420, boxShadow:T.shadowLg, animation:"fadeInUp .2s ease",
      }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.03em", color:T.tp }}>
            Queue<span style={{ color:T.accent }}>IQ</span>
          </div>
          <div style={{ fontSize:13, color:T.ts, marginTop:4 }}>
            {mode==="login"?"Sign in to your account":"Create a free account"}
          </div>
        </div>

        <div style={{ display:"flex", background:T.inputBg, borderRadius:T.rMd, padding:3, marginBottom:24, border:`1px solid ${T.border}` }}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);auth.clearError?.();}} style={{
              flex:1, padding:"8px 0", borderRadius:T.r, border:"none", cursor:"pointer",
              fontFamily:T.ff, fontSize:13, fontWeight:600, transition:"all .15s",
              background:mode===m?T.accent:"transparent", color:mode===m?"#fff":T.ts,
              boxShadow:mode===m?T.shadow:"none",
            }}>{m==="login"?"Sign In":"Register"}</button>
          ))}
        </div>

        {auth.error&&(
          <div style={{ padding:"10px 14px", background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:T.rMd, fontSize:13, color:T.red, marginBottom:16 }}>
            {auth.error}
          </div>
        )}

        {mode==="register"&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" style={inp()}/>}
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" style={inp()}/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
          placeholder={mode==="register"?"Password (min 8 characters)":"Password"}
          style={inp({ marginBottom:20 })} onKeyDown={e=>e.key==="Enter"&&submit()}/>

        <button onClick={submit} disabled={submitting} style={{
          width:"100%", padding:"12px 0", borderRadius:T.rMd, border:"none",
          background:T.accent, color:"#fff", fontSize:15, fontWeight:700,
          fontFamily:T.ff, cursor:submitting?"not-allowed":"pointer",
          opacity:submitting?.7:1, transition:"opacity .2s", boxShadow:T.shadow,
        }}>
          {submitting?"Please wait…":mode==="login"?"Sign In":"Create Account"}
        </button>

        <button onClick={onClose} style={{ display:"block",margin:"14px auto 0",background:"transparent",border:"none",color:T.ts,fontSize:13,cursor:"pointer",fontFamily:T.ff }}>
          Continue without signing in →
        </button>
      </div>
    </div>
  );
}
