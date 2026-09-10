import type { ReactNode } from "react";

/**
 * أشكال هندسية مرسومة يدويًا (SVG) لأسئلة مهارات التأسيس.
 * كل شكل يستخدم currentColor حتى يظهر في الوضع الليلي والنهاري.
 */

const S = {
  stroke: "currentColor",
  fill: "none",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Frame({ children, w = 420, h = 240 }: { children: ReactNode; w?: number; h?: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-md mx-auto text-foreground" role="img" aria-label="شكل هندسي">
      {children}
    </svg>
  );
}

function L({ x, y, children, size = 15 }: { x: number; y: number; children: ReactNode; size?: number }) {
  return (
    <text x={x} y={y} fontSize={size} fill="currentColor" stroke="none" textAnchor="middle" dominantBaseline="middle">
      {children}
    </text>
  );
}

/** شبكة مستطيلات m صف × n عمود */
function Grid({ rows, cols, cell = 52 }: { rows: number; cols: number; cell?: number }) {
  const w = cols * cell + 40;
  const h = rows * cell + 40;
  const lines: ReactNode[] = [];
  for (let r = 0; r <= rows; r++) lines.push(<line key={`r${r}`} x1={20} y1={20 + r * cell} x2={20 + cols * cell} y2={20 + r * cell} {...S} />);
  for (let c = 0; c <= cols; c++) lines.push(<line key={`c${c}`} x1={20 + c * cell} y1={20} x2={20 + c * cell} y2={20 + rows * cell} {...S} />);
  return <Frame w={w} h={h}>{lines}</Frame>;
}

const pentagon = (() => {
  const cx = 210, cy = 125, R = 82;
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  });
  const d = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [x1, y1] = pts[1];
  const [x0, y0] = pts[0];
  const ex = x1 + (x1 - x0) * 0.55;
  const ey = y1 + (y1 - y0) * 0.55;
  return (
    <Frame>
      <polygon points={d} {...S} />
      <line x1={x0} y1={y0} x2={ex} y2={ey} {...S} strokeDasharray="6 5" />
      <L x={ex + 18} y={ey + 6}>س</L>
      <L x={cx} y={cy}>خماسي منتظم</L>
    </Frame>
  );
})();

export const SKILL_FIGURES: Record<string, ReactNode> = {
  // مستقيمان متقاطعان وزاويتان متقابلتان بالرأس
  sk8_q4: (
    <Frame>
      <line x1={40} y1={60} x2={380} y2={190} {...S} />
      <line x1={40} y1={190} x2={380} y2={60} {...S} />
      <L x={150} y={125} size={14}>٢س + ٨٠</L>
      <L x={278} y={125} size={14}>س + ١٠٠</L>
    </Frame>
  ),

  sk8_q5: pentagon,

  // دائرة بقاطعين من نقطة خارجها (مثلث أ د جـ)
  sk8_q13: (
    <Frame>
      <circle cx={150} cy={120} r={80} {...S} />
      <line x1={360} y1={120} x2={72} y2={80} {...S} />
      <line x1={360} y1={120} x2={92} y2={175} {...S} />
      <line x1={72} y1={80} x2={116} y2={193} {...S} />
      <L x={62} y={68}>أ</L>
      <L x={200} y={78}>ب</L>
      <L x={118} y={207}>د</L>
      <L x={372} y={120}>جـ</L>
      <L x={96} y={110} size={13}>٥٠°</L>
      <L x={330} y={135} size={14}>س</L>
    </Frame>
  ),

  // رباعي دائري أ ب ج د
  sk8_q14: (
    <Frame>
      <circle cx={210} cy={120} r={90} {...S} />
      <polygon points="210,30 300,120 210,210 120,120" {...S} />
      <line x1={300} y1={120} x2={120} y2={120} {...S} strokeDasharray="6 5" />
      <L x={210} y={18}>أ</L>
      <L x={314} y={120}>ب</L>
      <L x={210} y={224}>ج</L>
      <L x={106} y={120}>د</L>
      <L x={210} y={46} size={13}>١٠٠°</L>
      <L x={168} y={150} size={13}>٦٠°</L>
      <L x={258} y={150} size={13}>س</L>
    </Frame>
  ),

  // مستقيمان متوازيان يقطعهما خط منكسر
  sk14_q2: (
    <Frame>
      <line x1={30} y1={60} x2={390} y2={60} {...S} />
      <line x1={30} y1={200} x2={390} y2={200} {...S} />
      <polyline points="120,60 250,130 150,200" {...S} />
      <L x={150} y={48} size={13}>٥٠°</L>
      <L x={196} y={196} size={13}>١٥٠°</L>
      <L x={252} y={112} size={14}>س</L>
    </Frame>
  ),

  // مستقيم قاطع لدرج من قطع متعامدة
  sk14_q9: (
    <Frame>
      <line x1={30} y1={50} x2={250} y2={50} {...S} />
      <polyline points="250,50 250,125 130,125 130,200" {...S} />
      <line x1={130} y1={200} x2={390} y2={200} {...S} />
      <line x1={60} y1={20} x2={330} y2={230} {...S} strokeDasharray="7 5" />
      <L x={132} y={38} size={13}>٢٦°</L>
      <L x={270} y={188} size={14}>س</L>
    </Frame>
  ),

  // متوازيان وقاطعان يتقاطعان أسفلهما
  sk14_q10: (
    <Frame>
      <line x1={30} y1={55} x2={390} y2={55} {...S} />
      <line x1={30} y1={140} x2={390} y2={140} {...S} />
      <line x1={300} y1={30} x2={190} y2={220} {...S} />
      <line x1={110} y1={30} x2={190} y2={220} {...S} />
      <L x={296} y={44} size={13}>٥٥°</L>
      <L x={222} y={128} size={14}>س</L>
    </Frame>
  ),

  // رباعي بقاعدتين متوازيتين وقطعة توازي الضلع الأيمن
  sk14_q11: (
    <Frame>
      <line x1={70} y1={60} x2={350} y2={60} {...S} />
      <polygon points="70,60 350,60 320,190 40,190" {...S} />
      <line x1={40} y1={190} x2={190} y2={60} {...S} strokeDasharray="6 5" />
      <L x={92} y={92} size={13}>١٠٠°</L>
      <L x={330} y={80} size={14}>ص</L>
    </Frame>
  ),

  // طاولات متلاصقة والجالسون حولها
  sk9_q5: (
    <Frame w={420} h={200}>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={90 + i * 80} y={70} width={80} height={60} {...S} />
      ))}
      {[0, 1, 2].map((i) => (
        <circle key={`t${i}`} cx={130 + i * 80} cy={48} r={11} {...S} />
      ))}
      {[0, 1, 2].map((i) => (
        <circle key={`b${i}`} cx={130 + i * 80} cy={152} r={11} {...S} />
      ))}
      <circle cx={64} cy={100} r={11} {...S} />
      <circle cx={356} cy={100} r={11} {...S} />
    </Frame>
  ),

  // شبكات العد
  sk11_q3: <Grid rows={1} cols={5} />,
  sk11_q4: <Grid rows={2} cols={5} />,
  sk11_q5: <Grid rows={2} cols={2} />,
  sk11_q6: <Grid rows={3} cols={3} />,

  // رسم بالصور: كل شكل = ٥ طلاب
  sk21_q9: (
    <Frame w={420} h={180}>
      {Array.from({ length: 7 }, (_, i) => {
        const x = 50 + i * 50;
        return (
          <g key={i}>
            <circle cx={x} cy={70} r={12} {...S} />
            <path d={`M ${x - 16} 118 q 16 -26 32 0`} {...S} />
          </g>
        );
      })}
      <L x={210} y={158} size={14}>كل شكل = ٥ طلاب</L>
    </Frame>
  ),
};

/** أشكال مقصوصة من الكتاب الأصلي (صور) — تُعرض قبل الرسم اليدوي */
const FIGURE_IMAGES = new Set([
  "sk5_q3","sk5_q4","sk8_q5","sk8_q6","sk8_q7","sk8_q8","sk8_q13","sk9_q5","sk10_q11","sk10_q12",
  "sk10_q14","sk10_q15","sk11_q3","sk11_q4","sk11_q5","sk11_q6","sk11_q7","sk11_q8","sk11_q9","sk11_q10",
  "sk11_q11","sk12_q9","sk14_q2","sk14_q4","sk14_q9","sk14_q10","sk14_q11","sk16_q1","sk16_q2","sk16_q9",
  "sk16_q10","sk16_q11","sk18_q4","sk18_q8","sk18_q9","sk18_q10","sk21_q4","sk21_q6","sk21_q9","sk21_q10",
  "sk23_q5","sk23_q9","sk23_q10","sk23_q11","sk23_q12","sk25_q6","sk25_q7","sk25_q8","sk25_q9","sk25_q10",
  "sk25_q11","sk25_q13","sk25_q14","sk26_q1","sk26_q2","sk26_q3","sk26_q4","sk26_q5","sk26_q6","sk26_q7",
  "sk26_q8","sk26_q9","sk26_q10","sk27_q3","sk28_q2","sk28_q6","sk29_q1","sk29_q2","sk29_q6","sk29_q7",
  "sk30_q9","sk30_q11",
]);

export function getSkillFigure(id: string): ReactNode | null {
  if (FIGURE_IMAGES.has(id)) {
    return (
      <img
        src={`/figures/${id}.png`}
        alt="شكل السؤال"
        loading="lazy"
        className="mx-auto max-h-72 w-auto max-w-full rounded-lg bg-white p-2 dark:bg-white"
      />
    );
  }
  return SKILL_FIGURES[id] ?? null;
}
