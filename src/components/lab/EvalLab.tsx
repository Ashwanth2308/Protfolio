import { CircleCheck, CircleX, Crosshair, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Chip, LabNote, PanelTitle, Slider, useWidth } from "./shared";

/* ───────── synthetic model scores (seeded, identical for every visitor) ───────── */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const normal = (r: () => number, mean: number, sd: number) => {
  const u = Math.max(1e-9, r());
  const v = r();
  return Math.min(0.999, Math.max(0.001, mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)));
};

type Scenario = {
  id: string;
  label: string;
  pos: string;
  neg: string;
  recallLabel: string;
  fprLabel: string;
  scores: { s: number; y: 0 | 1 }[];
};

const scenarios: Scenario[] = (() => {
  const r1 = rng(7);
  const inj: Scenario["scores"] = [
    ...Array.from({ length: 400 }, () => ({ s: normal(r1, 0.22, 0.12), y: 0 as const })),
    ...Array.from({ length: 80 }, () => ({ s: normal(r1, 0.74, 0.13), y: 1 as const })),
    ...Array.from({ length: 20 }, () => ({ s: normal(r1, 0.46, 0.1), y: 1 as const })), // subtle, indirect injections
  ];
  const r2 = rng(11);
  const fail: Scenario["scores"] = [
    ...Array.from({ length: 450 }, () => ({ s: normal(r2, 0.18, 0.1), y: 0 as const })),
    ...Array.from({ length: 50 }, () => ({ s: normal(r2, 0.66, 0.16), y: 1 as const })),
  ];
  return [
    { id: "inj", label: "Prompt-injection detector", pos: "attack", neg: "benign", recallLabel: "Attacks caught", fprLabel: "Benign requests blocked", scores: inj },
    { id: "fail", label: "Machine-failure predictor", pos: "failure", neg: "normal", recallLabel: "Failures caught", fprLabel: "False alarms", scores: fail },
  ];
})();

function metrics(scores: Scenario["scores"], t: number) {
  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0;
  for (const { s, y } of scores) {
    const p = s >= t;
    if (p && y) tp++;
    else if (p && !y) fp++;
    else if (!p && y) fn++;
    else tn++;
  }
  const precision = tp + fp ? tp / (tp + fp) : 1;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const fpr = fp + tn ? fp / (fp + tn) : 0;
  return { tp, fp, tn, fn, precision, recall, f1, fpr };
}

const THRESHOLDS = Array.from({ length: 99 }, (_, i) => (i + 1) / 100);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export default function EvalLab() {
  const [sid, setSid] = useState(scenarios[0].id);
  const [t, setT] = useState(0.5);
  const sc = scenarios.find((s) => s.id === sid)!;
  const curve = useMemo(() => THRESHOLDS.map((th) => ({ th, ...metrics(sc.scores, th) })), [sc]);
  const m = metrics(sc.scores, t);

  const presets = [
    { label: "Max F1", icon: Target, th: curve.reduce((a, b) => (b.f1 > a.f1 ? b : a)).th },
    { label: `Catch ≥ 95% of ${sc.pos}s`, icon: Crosshair, th: [...curve].reverse().find((c) => c.recall >= 0.95)?.th ?? 0.01 },
    { label: "≤ 1% false positives", icon: CircleCheck, th: curve.find((c) => c.fpr <= 0.01)?.th ?? 0.99 },
  ];

  return (
    <div className="p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Model</span>
        {scenarios.map((s) => (
          <Chip key={s.id} active={sid === s.id} onClick={() => setSid(s.id)}>
            {s.label}
          </Chip>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <Slider
          label="Decision threshold (flag when score ≥ threshold)"
          value={t}
          min={0.01}
          max={0.99}
          step={0.01}
          onChange={setT}
          format={(v) => v.toFixed(2)}
        />
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const I = p.icon;
            return (
              <button
                key={p.label}
                onClick={() => setT(p.th)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs transition-colors ${
                  Math.abs(t - p.th) < 0.005 ? "border-accent/60 bg-accent/10 text-fg" : "border-line text-muted hover:border-line-strong hover:text-fg"
                }`}
              >
                <I className="size-3.5" /> {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          { k: "Precision", v: pct(m.precision), sub: `of flagged are real ${sc.pos}s` },
          { k: sc.recallLabel, v: pct(m.recall), sub: "recall" },
          { k: "F1 score", v: m.f1.toFixed(3), sub: "balance of both" },
          { k: sc.fprLabel, v: pct(m.fpr), sub: "false-positive rate" },
        ].map((x) => (
          <div key={x.k} className="rounded-xl border border-line bg-bg/40 px-3 py-2.5">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-subtle">{x.k}</dt>
            <dd className="mt-0.5 font-display text-2xl font-semibold text-fg">{x.v}</dd>
            <dd className="text-[11px] text-subtle">{x.sub}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <PanelTitle n={1} meta="share of each class per score bin · drag to move the threshold">
            Score distribution
          </PanelTitle>
          <Histogram sc={sc} t={t} onT={setT} />
        </div>
        <div className="space-y-5">
          <div>
            <PanelTitle n={2}>Confusion matrix</PanelTitle>
            <Matrix m={m} pos={sc.pos} neg={sc.neg} />
          </div>
          <div>
            <PanelTitle n={3} meta="every threshold from 0.01 to 0.99">
              Precision–recall curve
            </PanelTitle>
            <PRCurve curve={curve} t={t} onT={setT} />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <LabNote>
          Synthetic scores, real metrics. Picking a threshold is a product decision: a security gateway wants to catch nearly every attack, users hate
          false blocks. It is the same trade-off I benchmarked for the LLM gateway (attack success rate vs false positives) and tracked for the CNC model
          (precision, recall and F1 to limit missed failures).
        </LabNote>
      </div>
    </div>
  );
}

function Histogram({ sc, t, onT }: { sc: Scenario; t: number; onT: (v: number) => void }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const BINS = 25;
  const bins = useMemo(() => {
    const b = Array.from({ length: BINS }, () => ({ pos: 0, neg: 0 }));
    const nPos = sc.scores.filter((s) => s.y).length;
    const nNeg = sc.scores.length - nPos;
    for (const { s, y } of sc.scores) {
      const i = Math.min(BINS - 1, Math.floor(s * BINS));
      if (y) b[i].pos++;
      else b[i].neg++;
    }
    return b.map((x) => ({ ...x, fp: x.pos / nPos, fn: x.neg / nNeg }));
  }, [sc]);
  const H = 240;
  const padL = 34;
  const padR = 8;
  const mid = H / 2;
  const iw = Math.max(10, width - padL - padR);
  const slot = iw / BINS;
  const bw = Math.min(24, slot - 2);
  const maxShare = Math.max(...bins.map((b) => Math.max(b.fp, b.fn)), 0.01);
  const hgt = (v: number) => (v / maxShare) * (mid - 22);
  const xT = padL + t * iw;

  const setFromEvent = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const v = Math.min(0.99, Math.max(0.01, (e.clientX - r.left - padL) / iw));
    onT(Math.round(v * 100) / 100);
  };

  return (
    <div ref={ref} className="relative rounded-2xl border border-line bg-card p-3">
      <div className="mb-2 flex flex-wrap gap-4 px-1 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-series-2" /> {sc.pos} (above)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-series-1" /> {sc.neg} (below)
        </span>
      </div>
      <svg
        width="100%"
        height={H}
        className="touch-none select-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromEvent(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons) setFromEvent(e);
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.floor((e.clientX - r.left - padL) / slot);
          setHover(i >= 0 && i < BINS ? i : null);
        }}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Score histogram for ${sc.label}, threshold ${t.toFixed(2)}`}
      >
        {/* flagged region */}
        <rect x={xT} y={8} width={Math.max(0, padL + iw - xT)} height={H - 30} fill="var(--accent)" opacity={0.05} />
        <line x1={padL} x2={padL + iw} y1={mid} y2={mid} stroke="var(--line-strong)" strokeWidth={1} />
        {bins.map((b, i) => {
          const x = padL + i * slot + (slot - bw) / 2;
          const hp = hgt(b.fp);
          const hn = hgt(b.fn);
          const dim = hover !== null && hover !== i;
          return (
            <g key={i} opacity={dim ? 0.55 : 1}>
              {hp > 0 && <path d={roundedUp(x, mid - 1, bw, hp)} fill="var(--series-2)" />}
              {hn > 0 && <path d={roundedDown(x, mid + 1, bw, hn)} fill="var(--series-1)" />}
            </g>
          );
        })}
        {/* threshold */}
        <line x1={xT} x2={xT} y1={8} y2={H - 22} stroke="var(--fg)" strokeWidth={2} />
        <rect x={xT - 26} y={0} width={52} height={18} rx={9} fill="var(--fg)" />
        <text x={xT} y={9} textAnchor="middle" dominantBaseline="middle" className="fill-[var(--bg)] font-mono text-[10px] font-semibold">
          {t.toFixed(2)}
        </text>
        <text x={Math.min(xT + 6, padL + iw - 40)} y={H - 26} className="fill-[var(--muted)] text-[10px]">
          flagged →
        </text>
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={padL + v * iw} y={H - 6} textAnchor={v === 0 ? "start" : v === 1 ? "end" : "middle"} className="fill-[var(--subtle)] font-mono text-[10px]">
            {v.toFixed(1)}
          </text>
        ))}
        <text x={4} y={mid - 30} className="fill-[var(--subtle)] font-mono text-[9.5px]">
          {Math.round(maxShare * 100)}%
        </text>
        <text x={4} y={mid + 34} className="fill-[var(--subtle)] font-mono text-[9.5px]">
          {Math.round(maxShare * 100)}%
        </text>
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-line-strong bg-elev px-2.5 py-1.5 text-xs shadow-xl"
          style={{ left: Math.min(padL + hover * slot + 16, width - 170), top: 34 }}
        >
          <div className="font-mono text-[10.5px] text-subtle">
            score {(hover / BINS).toFixed(2)}–{((hover + 1) / BINS).toFixed(2)}
          </div>
          <div className="flex items-center gap-1.5 text-fg">
            <span className="inline-block h-0.5 w-3 rounded bg-series-2" />
            <b>{bins[hover].pos}</b> <span className="text-muted">{sc.pos}s</span>
          </div>
          <div className="flex items-center gap-1.5 text-fg">
            <span className="inline-block h-0.5 w-3 rounded bg-series-1" />
            <b>{bins[hover].neg}</b> <span className="text-muted">{sc.neg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Bars grow from the baseline: rounded 4px data-end, square at the baseline.
function roundedUp(x: number, base: number, w: number, h: number) {
  const r = Math.min(4, h, w / 2);
  return `M ${x} ${base} V ${base - h + r} Q ${x} ${base - h} ${x + r} ${base - h} H ${x + w - r} Q ${x + w} ${base - h} ${x + w} ${base - h + r} V ${base} Z`;
}
function roundedDown(x: number, base: number, w: number, h: number) {
  const r = Math.min(4, h, w / 2);
  return `M ${x} ${base} V ${base + h - r} Q ${x} ${base + h} ${x + r} ${base + h} H ${x + w - r} Q ${x + w} ${base + h} ${x + w} ${base + h - r} V ${base} Z`;
}

function Matrix({ m, pos, neg }: { m: ReturnType<typeof metrics>; pos: string; neg: string }) {
  const cells = [
    { k: "True positive", v: m.tp, d: `${pos}s flagged`, ok: true },
    { k: "False negative", v: m.fn, d: `${pos}s missed`, ok: false },
    { k: "False positive", v: m.fp, d: `${neg} flagged`, ok: false },
    { k: "True negative", v: m.tn, d: `${neg} passed`, ok: true },
  ];
  return (
    <div className="grid grid-cols-[auto_1fr_1fr] gap-1.5 text-xs">
      <span />
      <span className="px-1 text-center font-mono text-[10px] uppercase tracking-wider text-subtle">flagged</span>
      <span className="px-1 text-center font-mono text-[10px] uppercase tracking-wider text-subtle">passed</span>
      {[0, 1].map((row) => (
        <div key={row} className="contents">
          <span className="self-center pr-1 font-mono text-[10px] uppercase tracking-wider text-subtle">{row === 0 ? pos : neg}</span>
          {(row === 0 ? [cells[0], cells[1]] : [cells[2], cells[3]]).map((c) => {
            const I = c.ok ? CircleCheck : CircleX;
            return (
              <div key={c.k} className="rounded-xl border border-line bg-bg/40 p-2.5">
                <div className="flex items-center gap-1.5">
                  <I className="size-3.5" style={{ color: c.ok ? "var(--status-good)" : "var(--status-critical)" }} />
                  <span className="font-display text-lg font-semibold text-fg">{c.v}</span>
                </div>
                <div className="text-[11px] text-muted">{c.k}</div>
                <div className="text-[10.5px] text-subtle">{c.d}</div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function PRCurve({ curve, t, onT }: { curve: ({ th: number } & ReturnType<typeof metrics>)[]; t: number; onT: (v: number) => void }) {
  const [ref, width] = useWidth<HTMLDivElement>(320);
  const [hover, setHover] = useState<number | null>(null);
  const H = 190;
  const pad = { l: 34, r: 10, t: 10, b: 24 };
  const iw = Math.max(10, width - pad.l - pad.r);
  const ih = H - pad.t - pad.b;
  const X = (r: number) => pad.l + r * iw;
  const Y = (p: number) => pad.t + (1 - p) * ih;
  const pts = [...curve].sort((a, b) => a.recall - b.recall || b.precision - a.precision);
  const d = `M ${pts.map((p) => `${X(p.recall).toFixed(1)},${Y(p.precision).toFixed(1)}`).join(" L ")}`;
  const cur = curve.reduce((a, b) => (Math.abs(b.th - t) < Math.abs(a.th - t) ? b : a));
  const hv = hover !== null ? pts[hover] : null;

  const nearest = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const rx = (e.clientX - r.left - pad.l) / iw;
    let bi = 0;
    pts.forEach((p, i) => {
      if (Math.abs(p.recall - rx) < Math.abs(pts[bi].recall - rx)) bi = i;
    });
    return bi;
  };

  return (
    <div ref={ref} className="relative rounded-2xl border border-line bg-card p-3">
      <svg
        width="100%"
        height={H}
        onPointerMove={(e) => setHover(nearest(e))}
        onPointerLeave={() => setHover(null)}
        onClick={(e) => onT(pts[nearest(e)].th)}
        className="cursor-crosshair"
        role="img"
        aria-label={`Precision-recall curve. Current threshold ${t.toFixed(2)}: precision ${pct(cur.precision)}, recall ${pct(cur.recall)}`}
      >
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={pad.l + iw} y1={Y(v)} y2={Y(v)} stroke="var(--line)" strokeWidth={1} />
            <text x={pad.l - 6} y={Y(v)} textAnchor="end" dominantBaseline="middle" className="fill-[var(--subtle)] font-mono text-[10px]">
              {v}
            </text>
            <text x={X(v)} y={H - 6} textAnchor={v === 0 ? "start" : v === 1 ? "end" : "middle"} className="fill-[var(--subtle)] font-mono text-[10px]">
              {v}
            </text>
          </g>
        ))}
        <text x={pad.l + iw / 2} y={H - 6} textAnchor="middle" className="fill-[var(--muted)] text-[10px]">
          recall →
        </text>
        <text x={pad.l + 4} y={pad.t + 10} className="fill-[var(--muted)] text-[10px]">
          precision
        </text>
        <path d={d} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {hv && <line x1={X(hv.recall)} x2={X(hv.recall)} y1={pad.t} y2={pad.t + ih} stroke="var(--muted)" strokeWidth={1} />}
        {hv && <circle cx={X(hv.recall)} cy={Y(hv.precision)} r={4} fill="var(--series-1)" stroke="var(--bg-elev)" strokeWidth={2} />}
        <circle cx={X(cur.recall)} cy={Y(cur.precision)} r={6} fill="var(--fg)" stroke="var(--bg-elev)" strokeWidth={2} />
        <text x={Math.min(X(cur.recall) + 10, pad.l + iw - 70)} y={Math.max(Y(cur.precision) + 16, pad.t + 24)} className="fill-[var(--fg)] font-mono text-[10px]">
          t = {t.toFixed(2)}
        </text>
      </svg>
      {hv && (
        <div className="pointer-events-none absolute top-3 z-10 rounded-lg border border-line-strong bg-elev px-2.5 py-1.5 text-xs shadow-xl" style={{ left: Math.min(X(hv.recall) + 14, width - 150) }}>
          <div className="font-semibold text-fg">
            P {pct(hv.precision)} · R {pct(hv.recall)}
          </div>
          <div className="font-mono text-[10.5px] text-subtle">threshold {hv.th.toFixed(2)} · click to use</div>
        </div>
      )}
    </div>
  );
}
