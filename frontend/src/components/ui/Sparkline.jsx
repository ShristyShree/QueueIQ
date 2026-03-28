import T from "./tokens.js";

const Sparkline = ({ data, color = T.accent, height = 56, nowHour }) => {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 300, H = height;
  const pts = data.map((d, i) => ({ x: (i / 23) * W, y: H - (d.value / max) * (H - 4) }));
  const line = pts.map((p, i) => `${i===0?"M":"L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H}Z`;
  const np   = pts[nowHour] ?? pts[0];
  const gid  = `sg${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity=".18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`}/>
      <path d={line}  fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1={np.x} y1={0} x2={np.x} y2={H} stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity=".5"/>
      <circle cx={np.x} cy={np.y} r="5"   fill="white" stroke={color} strokeWidth="2"/>
      <circle cx={np.x} cy={np.y} r="9"   fill={color} fillOpacity=".12"/>
    </svg>
  );
};

export default Sparkline;
