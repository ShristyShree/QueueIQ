import T from "./tokens.js";
import useAnimatedNumber from "../../hooks/useAnimatedNumber.js";

export function Tag({ children, color = T.accent, bg }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: ".06em",
      color, background: bg ?? color + "15",
      border: `1px solid ${color}30`,
      borderRadius: 5, padding: "2px 8px",
      textTransform: "uppercase", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

export function Pill({ children, icon, color = T.ts }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, color, background: T.inputBg,
      border: `1px solid ${T.border}`, borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap",
    }}>
      {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
      {children}
    </span>
  );
}

export function CrowdBadge({ level }) {
  const map = {
    Low:    { c: T.green,  bg: T.greenBg,  border: T.greenBorder  },
    Medium: { c: T.amber,  bg: T.amberBg,  border: T.amberBorder  },
    High:   { c: T.red,    bg: T.redBg,    border: T.redBorder    },
  };
  const s = map[level] ?? map.Medium;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: "5px 12px", borderRadius: 20,
      background: s.bg, border: `1px solid ${s.border}`,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", background: s.c, flexShrink: 0,
        boxShadow: `0 0 0 2px ${s.border}`,
      }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: s.c, letterSpacing: ".05em" }}>
        {level.toUpperCase()}
      </span>
    </span>
  );
}

// Confidence ring gauge — light theme
export function ConfRing({ value }) {
  const r = 38, cx = 48, cy = 48;
  const st = Math.PI * 0.75, sp = Math.PI * 1.5;
  const fill = (value / 100) * sp;
  const pt = a => ({ x: cx + r * Math.cos(a - Math.PI/2), y: cy + r * Math.sin(a - Math.PI/2) });
  const arc = (s, e) => {
    const S = pt(s), E = pt(e), lg = e - s > Math.PI ? 1 : 0;
    return `M${S.x.toFixed(2)} ${S.y.toFixed(2)} A${r} ${r} 0 ${lg} 1 ${E.x.toFixed(2)} ${E.y.toFixed(2)}`;
  };
  const color = value >= 80 ? T.green : value >= 58 ? T.amber : T.red;
  return (
    <svg width="96" height="72" viewBox="0 0 96 72">
      <path d={arc(st, st+sp)} fill="none" stroke={T.border} strokeWidth="5" strokeLinecap="round"/>
      <path d={arc(st, st+fill)} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"/>
      <text x="48" y="54" textAnchor="middle" fontSize="17" fontWeight="700" fill={T.tp} fontFamily={T.ff}>{value}%</text>
    </svg>
  );
}

// Animated number
export function AN({ value, color = T.tp, size = 46 }) {
  const d = useAnimatedNumber(value);
  return (
    <span style={{ fontSize: size, fontWeight: 800, color, fontFamily: T.ff, letterSpacing: "-0.04em", lineHeight: 1 }}>
      {d}
    </span>
  );
}

// Loading shimmer skeleton
export function Shimmer({ width = "100%", height = 20, radius = 6 }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)",
      backgroundSize: "400% 100%",
      animation: "shimmer 1.4s ease infinite",
    }} />
  );
}
