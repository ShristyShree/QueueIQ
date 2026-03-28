/**
 * PREDICTION ENGINE v4
 * =====================
 * Accepts either a hospitalId (looks up from HOSPITALS array) OR
 * a direct hospitalObject (for synthetic/unknown hospitals).
 * This makes predictions work for any hospital — dataset or not.
 */

import HOSPITALS     from "../data/hospitals.js";
import QUEUE_HOURS   from "../data/queueHours.js";
import { isWeekend, fmt12 } from "../utils/time.js";

export function runPredict({
  hospitalId,
  hospitalObject = null,   // ← NEW: pass directly for synthetic hospitals
  queueKey,
  hour,
  dayOfWeek,
  peopleAhead = 0,
  doctorId = null,
  feedbackData = [],
  learnedServiceMap = {},
}) {
  // Resolve hospital: prefer passed object, then look up from dataset
  const hosp = hospitalObject ?? HOSPITALS.find(h => h.id === hospitalId);
  if (!hosp) return null;

  const q = hosp.queues?.[queueKey];
  if (!q) return null;

  const hrs    = QUEUE_HOURS[queueKey];
  const wknd   = isWeekend(dayOfWeek);
  const mult   = wknd ? (q.weekendMult ?? 0.7) : 1.0;

  // ── Operating hours guard ──────────────────────────────
  if (hrs && (hour < hrs.open || hour > hrs.close)) {
    let bestH = hrs.open, bestV = 9999;
    for (let h = hrs.open; h <= hrs.close; h++) {
      const v = (q.baseProfile?.[h] ?? 0) * mult;
      if (v < bestV) { bestV = v; bestH = h; }
    }
    return {
      closed: true, reason: "outside_hours",
      queueLabel: q.label, hoursLabel: hrs.label,
      suggestion: `Try ${fmt12(bestH)} — typically lowest crowd during ${hrs.label}`,
      nextBestHour: bestH, nextBestVal: Math.round(bestV),
    };
  }

  // ── Doctor availability check ──────────────────────────
  let doctor = null;
  if (doctorId && queueKey === "doctor") {
    doctor = hosp.doctors?.find(d => d.id === doctorId);
    if (doctor && (hour < doctor.availStart || hour >= doctor.availEnd)) {
      return {
        closed: true, reason: "doctor_unavailable",
        doctorName: doctor.name, specialty: doctor.specialty,
        availStart: doctor.availStart, availEnd: doctor.availEnd,
        suggestion: `${doctor.name} is available ${fmt12(doctor.availStart)}–${fmt12(doctor.availEnd)}`,
        nextBestHour: doctor.availStart,
      };
    }
  }

  // ── Base prediction ─────────────────────────────────────
  const rawBase   = (q.baseProfile?.[hour] ?? 0) * mult;
  const docFactor = doctor ? (doctor.waitMultiplier ?? 1.0) : 1.0;
  const lsKey     = `${hosp.id}_${queueKey}`;
  const fbRows    = (feedbackData || []).filter(
    f => f.hospitalId === hosp.id && f.queueKey === queueKey
  );

  let fbAdj = 0;
  if (fbRows.length >= 2) {
    const recent = fbRows.slice(-5);
    fbAdj = recent.reduce((s, f) => s + (f.actual - f.predicted), 0) / recent.length * 0.45;
  }
  const historicalPred = Math.max(0, rawBase * docFactor + fbAdj);

  const baseSvc  = doctor?.avgConsultMin ?? (learnedServiceMap[lsKey] ?? q.avgServiceMin ?? 10);
  const livePred = peopleAhead * baseSvc;
  const liveW    = Math.min(0.80, 0.15 + (peopleAhead / 25) * 0.65);
  const modelW   = 1 - liveW;

  const blended  = modelW * historicalPred + liveW * livePred;
  const combined = doctor ? 0.7 * blended + 0.3 * livePred : blended;

  // ── Uncertainty ─────────────────────────────────────────
  const baseSigma = Math.max(3, historicalPred * 0.24);
  const fbReduce  = Math.min(0.55, fbRows.length * 0.07);
  const sigma     = baseSigma * (1 - fbReduce);

  const low  = Math.max(1, Math.round(combined - sigma));
  const high = Math.round(combined + sigma * 1.55);

  // ── Confidence ──────────────────────────────────────────
  const accuracy = q.modelAccuracy ?? 70;
  const rawConf  = 50 + (accuracy - 75) * 0.9 + fbRows.length * 1.8
    + (peopleAhead > 0 ? 6 : 0) + (doctor ? 5 : 0)
    + (hosp.isSynthetic ? -15 : 0)   // penalty for fully estimated data
    + (hosp.isOSMOnly   ? -10 : 0);  // smaller penalty for real but uncharted hospitals
  const confidence = Math.min(96, Math.max(35, Math.round(rawConf)));

  const crowd = combined < 12 ? "Low" : combined < 30 ? "Medium" : "High";

  // ── Best / worst within hours ────────────────────────────
  const opOpen = hrs?.open ?? 6, opClose = hrs?.close ?? 21;
  let bestHour = opOpen, bestVal = 9999, worstHour = opOpen, worstVal = 0;
  for (let h = opOpen; h <= opClose; h++) {
    const v = (q.baseProfile?.[h] ?? 0) * mult * docFactor;
    if (v < bestVal) { bestVal = v; bestHour = h; }
    if (v > worstVal) { worstVal = v; worstHour = h; }
  }

  // ── Explanations ────────────────────────────────────────
  const explanations = [];
  if (hosp.isSynthetic) {
    explanations.push(`"${hosp.name}" is not in our dataset — using estimated patterns`);
    explanations.push("Predictions are based on typical city hospital averages");
  } else if (hosp.isOSMOnly) {
    explanations.push(`"${hosp.name}" found via OpenStreetMap — predictions use city average patterns`);
    explanations.push("Submit feedback after your visit to improve accuracy for this hospital");
  } else if (wknd) {
    explanations.push(`Weekend — ~${Math.round((1 - (q.weekendMult ?? 0.7)) * 100)}% lighter footfall`);
  } else {
    explanations.push(`Weekday — standard crowd pattern for ${hosp.shortName ?? hosp.name}`);
  }

  if (doctor) {
    explanations.push(`${doctor.name} (${doctor.specialty}) — popularity index ${doctor.popularityIndex}/100`);
    if (doctor.popularityIndex > 85)
      explanations.push(`High-demand specialist — adds ~${Math.round((doctor.waitMultiplier - 1) * 100)}% to wait`);
  }
  if ((q.peakHours ?? []).includes(hour))
    explanations.push(`${fmt12(hour)} is a confirmed peak slot`);
  else if (combined < 12)
    explanations.push(`${fmt12(hour)} is a low-traffic window — good time to visit`);
  if (peopleAhead > 8)
    explanations.push(`${peopleAhead} people in queue — live signal weighted at ${Math.round(liveW * 100)}%`);
  else if (peopleAhead > 0)
    explanations.push(`${peopleAhead} people ahead — light live adjustment applied`);
  else
    explanations.push("No live count — prediction from historical model");
  if (fbRows.length >= 3)
    explanations.push(`Self-calibrated from ${fbRows.length} past visits`);
  if (q.notes?.[0])
    explanations.push(q.notes[0]);

  return {
    low, high, combined: Math.round(combined),
    confidence, crowd,
    bestHour, bestVal: Math.round(bestVal),
    worstHour, worstVal: Math.round(worstVal),
    bestHourLabel: `${fmt12(bestHour)} (lowest crowd during ${hrs?.label ?? "operating hours"})`,
    explanations,
    modelPrediction: Math.round(historicalPred),
    livePrediction:  Math.round(livePred),
    liveWeight:      Math.round(liveW * 100),
    modelWeight:     Math.round(modelW * 100),
    sigma:           Math.round(sigma),
    notes:           q.notes ?? [],
    feedbackCount:   fbRows.length,
    hoursLabel:      hrs?.label ?? null,
    doctor,
    avgVisitsData:   hosp.totalDataPoints ?? null,
    isSynthetic:     !!hosp.isSynthetic,
    isOSMOnly:       !!hosp.isOSMOnly,
  };
}

export function buildProfile(hospitalId, queueKey, dayOfWeek, doctorId = null, hospitalObject = null) {
  const hosp = hospitalObject ?? HOSPITALS.find(h => h.id === hospitalId);
  if (!hosp) return [];
  const q   = hosp.queues?.[queueKey];
  if (!q)  return [];
  const mult      = isWeekend(dayOfWeek) ? (q.weekendMult ?? 0.7) : 1.0;
  const hrs       = QUEUE_HOURS[queueKey];
  const doctor    = doctorId ? hosp.doctors?.find(d => d.id === doctorId) : null;
  const docFactor = doctor ? (doctor.waitMultiplier ?? 1.0) : 1.0;

  return (q.baseProfile ?? []).map((v, h) => ({
    hour: h,
    value:    Math.round(v * mult * docFactor),
    inactive: hrs ? (h < hrs.open || h > hrs.close) : false,
    doctorUnavail: doctor ? (h < doctor.availStart || h >= doctor.availEnd) : false,
  }));
}
