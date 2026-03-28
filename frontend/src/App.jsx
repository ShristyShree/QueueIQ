import { useState, useEffect, useRef } from "react";

import HOSPITALS                    from "./data/hospitals.js";
import CITIES, { DEFAULT_CITY }     from "./data/cities.js";
import { runPredict, buildProfile } from "./engine/predict.js";
import useGeolocation               from "./hooks/useGeolocation.js";
import useOSMHospitals              from "./hooks/useOSMHospitals.js";
import { haversineKm }              from "./utils/geo.js";
import T                            from "./components/ui/tokens.js";
import Header                       from "./components/layout/Header.jsx";
import Sidebar                      from "./components/layout/Sidebar.jsx";
import QueueTypeSelector            from "./components/layout/QueueTypeSelector.jsx";
import LiveTab                      from "./components/tabs/LiveTab.jsx";
import SimulatorTab                 from "./components/tabs/SimulatorTab.jsx";
import HistoryTab                   from "./components/tabs/HistoryTab.jsx";

export default function App() {
  const now = new Date();

  // ── Core selection ──────────────────────────────────────
  const [hospId,       setHospId]       = useState("apollo_greams");
  const [queueKey,     setQueueKey]     = useState("doctor");
  const [doctorId,     setDoctorId]     = useState(null);
  // Holds a synthetic hospital object when user searches an unknown hospital
  const [syntheticHosp, setSyntheticHosp] = useState(null);

  // ── Live tab ────────────────────────────────────────────
  const [hour,   setHour]   = useState(now.getHours());
  const [day,    setDay]    = useState(now.getDay());
  const [people, setPeople] = useState(0);

  // ── Simulator tab ────────────────────────────────────────
  const [simHour, setSimHour] = useState(now.getHours());
  const [simDay,  setSimDay]  = useState(now.getDay());

  // ── Feedback & learning ──────────────────────────────────
  const [feedback,   setFeedback]   = useState([]);
  const [fbInput,    setFbInput]    = useState("");
  const [fbDone,     setFbDone]     = useState(false);
  const [learnedSvc, setLearnedSvc] = useState({});

  // ── UI ───────────────────────────────────────────────────
  const [tab,       setTab]       = useState("live");
  const [sideOpen,  setSideOpen]  = useState(true);
  const [toast,     setToast]     = useState(null);

  // ── Geo + city ───────────────────────────────────────────
  const geo    = useGeolocation();
  const [cityId, setCityId] = useState(DEFAULT_CITY.id);
  const refCity   = CITIES.find(c => c.id === cityId) ?? DEFAULT_CITY;
  const refCoords = geo.status === "granted" && geo.coords ? geo.coords : refCity.coords;

  // ── Real-time OSM hospital data ──────────────────────────
  const {
    hospitals:   osmHospitals,
    loading:     osmLoading,
    error:       osmError,
    source:      dataSource,
    nearestId:   osmNearestId,
  } = useOSMHospitals(refCoords, true);

  // hospitalsWithDist already has distKm from useOSMHospitals
  const sorted          = osmHospitals;
  const hospitalsWithDist = osmHospitals;   // alias for breadcrumb distance lookup

  // Inject synthetic hospital at the top of the sidebar list when selected
  const sidebarHospitals = syntheticHosp
    ? [syntheticHosp, ...sorted]
    : sorted;

  const nearestId = syntheticHosp ? osmNearestId : (osmNearestId ?? sorted[0]?.id);
  const cityHint  = CITIES.find(c => c.id === cityId)?.name ?? "Chennai";

  const autoSel = useRef(false);
  useEffect(() => {
    // Auto-select nearest real hospital once OSM data loads and GPS is available
    if (geo.status === "granted" && nearestId && !autoSel.current && !osmLoading) {
      autoSel.current = true;
      setHospId(nearestId);
    }
  }, [geo.status, nearestId, osmLoading]);

  // ── Derived ──────────────────────────────────────────────
  // hosp = real hospital OR the synthetic entry if user searched an unknown one
  // Resolve active hospital: synthetic > OSM list > static fallback
  const hosp = syntheticHosp?.id === hospId
    ? syntheticHosp
    : (osmHospitals.find(h => h.id === hospId) ?? HOSPITALS.find(h => h.id === hospId));
  const allQueues = hosp ? Object.keys(hosp.queues) : [];
  useEffect(() => {
    if (!allQueues.includes(queueKey)) setQueueKey(allQueues[0] ?? "doctor");
    setDoctorId(null);   // reset doctor when hospital changes
  }, [hospId]);
  useEffect(() => {
    setDoctorId(null);   // reset doctor when queue changes
  }, [queueKey]);

  const lsKey    = `${hospId}_${queueKey}`;
  // Pass hospitalObject for synthetic hospitals so the engine doesn't need DB lookup
  // Pass hospitalObject for OSM-only or synthetic hospitals (not in HOSPITALS array)
  const isOSMOnly = !HOSPITALS.find(h => h.id === hospId);
  const hospObj   = syntheticHosp?.id === hospId
    ? syntheticHosp
    : isOSMOnly ? (osmHospitals.find(h => h.id === hospId) ?? null) : null;
  const result   = runPredict({ hospitalId:hospId, hospitalObject:hospObj, queueKey, hour, dayOfWeek:day, peopleAhead:people, doctorId, feedbackData:feedback, learnedServiceMap:learnedSvc });
  const simResult= runPredict({ hospitalId:hospId, hospitalObject:hospObj, queueKey, hour:simHour, dayOfWeek:simDay, peopleAhead:0, doctorId:null, feedbackData:feedback, learnedServiceMap:learnedSvc });
  const profile    = buildProfile(hospId, queueKey, day, doctorId, hospObj);
  const simProfile = buildProfile(hospId, queueKey, simDay, null, hospObj);


  /**
   * handleSelect — called by both Sidebar hospital cards AND SmartSearchBar.
   *
   * SmartSearchBar passes the FULL suggestion object (real or synthetic).
   * Sidebar hospital cards pass just the id string.
   *
   * For synthetic (unknown) hospitals:
   *   - Store the full synthetic object in syntheticHosp state
   *   - Set hospId to the synthetic id so it shows as "selected"
   *   - Predictions use the synthetic hospital's estimated queue profiles
   *
   * For real hospitals:
   *   - Clear any synthetic state
   *   - Set hospId normally
   */
  const handleSelect = (suggestion) => {
    // Called from Sidebar card (plain string id) or SmartSearchBar (full object)
    if (typeof suggestion === "string") {
      // Plain id from sidebar card click
      setSyntheticHosp(null);
      setHospId(suggestion);
      return;
    }

    // Full suggestion object from SmartSearchBar
    if (suggestion.isSynthetic) {
      // Unknown hospital — inject it as the active hospital
      setSyntheticHosp(suggestion);
      setHospId(suggestion.id);
      // Reset queue/doctor since synthetic has generic defaults
      setQueueKey("doctor");
      setDoctorId(null);
      showToast(`"${suggestion.name}" added — using estimated predictions`, T.purple);
    } else {
      // Known hospital
      setSyntheticHosp(null);
      setHospId(suggestion.id);
    }
  };

  // ── Toast ─────────────────────────────────────────────────
  const showToast = (msg, color = T.green) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2800);
  };

  // ── Feedback submission ──────────────────────────────────
  const submitFeedback = () => {
    const actual = parseFloat(fbInput);
    if (isNaN(actual) || actual < 0) return;
    const predicted = result?.closed ? 0 : (result?.combined ?? 0);
    const entry     = { hospitalId:hospId, queueKey, predicted, actual, hour, day, ts:Date.now() };
    const newFb     = [...feedback, entry];
    setFeedback(newFb);

    const rel = newFb.filter(f => f.hospitalId===hospId && f.queueKey===queueKey);
    if (rel.length >= 2 && hosp) {
      const q = hosp.queues[queueKey];
      if (q) {
        const avg = rel.slice(-5).reduce((s,f)=>s+f.actual,0)/Math.min(rel.length,5);
        setLearnedSvc(p => ({ ...p, [lsKey]: parseFloat((Math.max(1, q.avgServiceMin+(avg-predicted)*0.1)).toFixed(1)) }));
      }
    }
    setFbInput(""); setFbDone(true);
    setTimeout(() => setFbDone(false), 2000);
    showToast(`Feedback saved — ${hosp?.shortName} model updated ✓`);
  };

  const currentHospWithDist = syntheticHosp?.id === hospId
    ? syntheticHosp
    : hospitalsWithDist.find(h => h.id === hospId);

  return (
    <div style={{ background:T.bg, minHeight:"100vh", fontFamily:T.ff, color:T.tp }}>

      {/* ── Global CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${T.inputBg}}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:${T.borderMid}}
        input[type=range]{-webkit-appearance:none;appearance:none;height:5px;border-radius:3px;outline:none;cursor:pointer;
          background:linear-gradient(to right,var(--clr,${T.accent}) var(--pct,0%),${T.border} var(--pct,0%))}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:17px;height:17px;border-radius:50%;
          background:var(--clr,${T.accent});border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.15);margin-top:0}
        select{outline:none}
        select option{background:${T.surface};color:${T.tp}}
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .card-hover:hover{box-shadow:${T.shadowMd};transform:translateY(-1px)}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:18, right:22, background:toast.color, color:"#fff", padding:"10px 20px", borderRadius:T.rMd, fontSize:13, fontWeight:600, zIndex:999, boxShadow:T.shadowLg, animation:"fadeInUp .2s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <Header tab={tab} setTab={setTab} liveUsers={hosp?.liveUsers} lastUpdated={hosp?.lastUpdated} />

      {/* Layout */}
      <div style={{ display:"flex", maxWidth:1260, margin:"0 auto" }}>

        {/* Sidebar */}
        <div style={{ width:sideOpen?290:0, flexShrink:0, transition:"width .25s", overflow:"hidden" }}>
          <Sidebar
            hospitals={sidebarHospitals}
            nearestId={nearestId}
            selectedId={hospId}
            onSelect={handleSelect}
            geo={geo}
            cityId={cityId}
            setCityId={setCityId}
            refCoords={refCoords}
            cityHint={cityHint}
            osmLoading={osmLoading}
            osmError={osmError}
            dataSource={dataSource}
          />
        </div>

        {/* Main panel */}
        <div style={{ flex:1, padding:"20px 24px 48px", minWidth:0 }}>

          {/* Toolbar row */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <button onClick={() => setSideOpen(p=>!p)} style={{
              padding:"6px 12px", borderRadius:T.r, border:`1px solid ${T.border}`,
              background:T.card, color:T.ts, fontSize:12, cursor:"pointer",
              fontFamily:T.ff, boxShadow:T.shadow,
            }}>
              {sideOpen ? "◀ Hide" : "▶ Hospitals"}
            </button>

            {/* Breadcrumb */}
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:T.ts, flexWrap:"wrap" }}>
              <span>{hosp?.isSynthetic ? "🔍" : "🏥"}</span>
              <span style={{ color:T.tp, fontWeight:700 }}>{hosp?.name}</span>
              <span style={{ color:T.ti }}>·</span>
              <span>{hosp?.area}</span>
              {hosp && (
                <>
                  <span style={{ color:T.ti }}>·</span>
                  <span style={{ fontSize:10, fontWeight:700,
                    color: hosp.badgeColor ?? T.accent,
                    background: (hosp.badgeColor ?? T.accent) + "15",
                    border:`1px solid ${(hosp.badgeColor ?? T.accent)}25`,
                    borderRadius:4, padding:"2px 7px" }}>
                    {hosp.badge}
                  </span>
                </>
              )}
              {hosp?.isSynthetic && (
                <span style={{ fontSize:11, color:"#7C3AED",
                  background:"#F5F3FF", border:"1px solid #DDD6FE",
                  borderRadius:20, padding:"3px 10px" }}>
                  ⚠️ Estimated data — not in our dataset
                </span>
              )}
              {!hosp?.isSynthetic && currentHospWithDist?.distKm != null && (
                <span style={{ fontSize:11,
                  color: hospId===nearestId ? T.green : T.accent,
                  background: hospId===nearestId ? T.greenBg : T.accentLight,
                  border:`1px solid ${hospId===nearestId ? T.greenBorder : T.accentBorder}`,
                  borderRadius:20, padding:"3px 10px" }}>
                  📍 {currentHospWithDist.distKm.toFixed(1)} km
                  {hospId===nearestId ? " · Nearest" : ""}
                </span>
              )}
            </div>


          </div>

          {/* Queue selector */}
          <QueueTypeSelector hospital={hosp} queueKey={queueKey} setQueueKey={setQueueKey} currentHour={hour} />

          {/* Tabs */}
          {tab === "live" && (
            <LiveTab
              hospital={hosp} queueKey={queueKey}
              hour={hour}     setHour={setHour}
              day={day}       setDay={setDay}
              people={people} setPeople={setPeople}
              result={result} profile={profile}
              loading={false}
              selectedDoctor={doctorId} setSelectedDoctor={setDoctorId}
            />
          )}
          {tab === "simulator" && (
            <SimulatorTab
              hospital={hosp} queueKey={queueKey}
              simHour={simHour} setSimHour={setSimHour}
              simDay={simDay}   setSimDay={setSimDay}
              simResult={simResult} simProfile={simProfile}
            />
          )}
          {tab === "history" && (
            <HistoryTab
              hospital={hosp} queueKey={queueKey} result={result}
              feedback={feedback}
              fbInput={fbInput}   setFbInput={setFbInput}
              fbDone={fbDone}
              learnedSvc={learnedSvc} lsKey={lsKey}
              onSubmit={submitFeedback}
            />
          )}
        </div>
      </div>
    </div>
  );
}