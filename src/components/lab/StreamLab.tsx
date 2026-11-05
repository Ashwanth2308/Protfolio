import { useInView } from "motion/react";
import { CircleAlert, CircleCheck, Flame, Pause, Play, RotateCcw, Siren, Waves, Wrench } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LabNote, PanelTitle } from "./shared";

type Sample = { t: number; vib: number; temp: number; cur: number; rpm: number; risk: number };
type Status = "normal" | "warning" | "critical";

const WINDOW = 150; // 15 s at 10 Hz
const FEAT = 30; // 3 s rolling window

const gauss = () => {
  let u = 0;
  let v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const relu = (x: number) => Math.max(0, x);
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

function features(buf: Sample[]) {
  const w = buf.slice(-FEAT);
  const n = w.length || 1;
  const vibMean = w.reduce((a, s) => a + s.vib, 0) / n;
  const vibPeak = Math.max(...w.map((s) => s.vib));
  const curMean = w.reduce((a, s) => a + s.cur, 0) / n;
  const temp = w[w.length - 1]?.temp ?? 45;
  // least-squares slope of temperature, °C per second
  const xs = w.map((_, i) => i / 10);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = w.reduce((a, s) => a + s.temp, 0) / n;
  const num = w.reduce((a, s, i) => a + (xs[i] - mx) * (s.temp - my), 0);
  const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0) || 1;
  const tempSlope = num / den;
  const contrib = {
    "Vibration RMS": 1.3 * relu((vibMean - 2.2) / 0.45),
    "Vibration peaks": 0.5 * relu((vibPeak - 3.0) / 0.8),
    Temperature: 1.1 * relu((temp - 49) / 3.5),
    "Temperature trend": 0.9 * relu(tempSlope / 0.35),
    "Spindle current": 0.9 * relu((curMean - 8.8) / 1.2),
  };
  const risk = sigmoid(-4.2 + Object.values(contrib).reduce((a, b) => a + b, 0));
  return { vibMean, vibPeak, curMean, temp, tempSlope, contrib, risk };
}

const statusOf = (r: number): Status => (r >= 0.7 ? "critical" : r >= 0.3 ? "warning" : "normal");
const STATUS = {
  normal: { label: "Normal", color: "var(--status-good)", icon: CircleCheck },
  warning: { label: "Warning", color: "var(--status-warning)", icon: CircleAlert },
  critical: { label: "Failure risk", color: "var(--status-critical)", icon: Siren },
} as const;

export default function StreamLab() {
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { margin: "100px" });
  const [running, setRunning] = useState(true);
  const [, force] = useState(0);
  const buf = useRef<Sample[]>([]);
  const sim = useRef({ t: 0, temp: 45, wear: 0, heat: 0, brk: 0, bearing: false, overheat: false });
  const [events, setEvents] = useState<{ t: number; s: Status; why: string }[]>([]);
  const lastStatus = useRef<Status>("normal");

  const step = useCallback(() => {
    const s = sim.current;
    s.t += 0.1;
    if (s.bearing) s.wear = Math.min(4, s.wear + 0.02);
    if (s.overheat) s.heat = Math.min(30, s.heat + 0.3);
    s.brk = Math.max(0, s.brk - 1);
    const brk = s.brk / 25;
    s.temp += (45 + s.heat - s.temp) * 0.08 + gauss() * 0.06;
    const spike = s.bearing && Math.random() < 0.08 ? Math.random() * 2.5 * (s.wear / 4 + 0.2) : 0;
    const sample: Sample = {
      t: s.t,
      vib: Math.max(0.2, 2 + gauss() * 0.18 + s.wear + spike + 5 * brk),
      temp: s.temp,
      cur: 8 + gauss() * 0.25 + s.wear * 0.3 + 6 * brk,
      rpm: 3000 + gauss() * 15 - s.wear * 20 - brk * 300,
      risk: 0,
    };
    const next = [...buf.current, sample].slice(-WINDOW);
    const f = features(next);
    sample.risk = f.risk;
    buf.current = next;

    const st = statusOf(f.risk);
    if (st !== lastStatus.current) {
      const [why, v] = Object.entries(f.contrib).sort((a, b) => b[1] - a[1])[0];
      const detail =
        st === "normal"
          ? "all features back inside normal range"
          : why.startsWith("Vibration")
            ? `${why.toLowerCase()} ${why === "Vibration RMS" ? f.vibMean.toFixed(2) : f.vibPeak.toFixed(2)} mm/s`
            : why === "Spindle current"
              ? `spindle current ${f.curMean.toFixed(1)} A`
              : why === "Temperature"
                ? `temperature ${f.temp.toFixed(1)} °C`
                : `temperature rising ${f.tempSlope.toFixed(2)} °C/s`;
      if (v > 0 || st === "normal") setEvents((e) => [{ t: s.t, s: st, why: detail }, ...e].slice(0, 6));
      lastStatus.current = st;
    }
    force((n) => n + 1);
  }, []);

  // warm-up so the charts start full
  useEffect(() => {
    if (buf.current.length) return;
    for (let i = 0; i < WINDOW; i++) step();
    setEvents([]);
  }, [step]);

  useEffect(() => {
    if (!running || !inView) return;
    const id = window.setInterval(() => {
      if (!document.hidden) step();
    }, 100);
    return () => window.clearInterval(id);
  }, [running, inView, step]);

  const inject = (kind: "bearing" | "overheat" | "break") => {
    const s = sim.current;
    if (kind === "bearing") s.bearing = true;
    if (kind === "overheat") s.overheat = true;
    if (kind === "break") s.brk = 25;
    setRunning(true);
  };
  const reset = () => {
    Object.assign(sim.current, { wear: 0, heat: 0, brk: 0, bearing: false, overheat: false });
    sim.current.temp = 45;
    buf.current = [];
    for (let i = 0; i < WINDOW; i++) step();
    lastStatus.current = "normal";
    setEvents([]);
  };

  const data = buf.current;
  const f = features(data);
  const status = statusOf(f.risk);
  const S = STATUS[status];
  const Icon = S.icon;

  return (
    <div ref={root} className="p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Inject a fault</span>
        <FaultButton onClick={() => inject("bearing")} active={sim.current.bearing} icon={<Waves className="size-3.5" />}>
          Bearing wear
        </FaultButton>
        <FaultButton onClick={() => inject("overheat")} active={sim.current.overheat} icon={<Flame className="size-3.5" />}>
          Overheating
        </FaultButton>
        <FaultButton onClick={() => inject("break")} active={sim.current.brk > 0} icon={<Wrench className="size-3.5" />}>
          Tool break
        </FaultButton>
        <span className="ml-auto flex gap-2">
          <button onClick={() => setRunning((r) => !r)} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs text-fg hover:border-line-strong">
            {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />} {running ? "Pause" : "Resume"}
          </button>
          <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs text-fg hover:border-line-strong">
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <LineChart title="Vibration" unit="mm/s" data={data} field="vib" color="var(--series-1)" min={0} max={9} alert={3.5} digits={2} />
          <LineChart title="Spindle temperature" unit="°C" data={data} field="temp" color="var(--series-2)" min={40} max={80} alert={52} digits={1} />
        </div>

        <div className="space-y-4">
          {/* risk */}
          <div className="rounded-2xl border border-line bg-card p-5">
            <PanelTitle meta="rolling 3 s features → logistic score">Failure risk</PanelTitle>
            <div className="flex items-end justify-between gap-3">
              <div className="font-display text-5xl font-semibold text-fg">{Math.round(f.risk * 100)}%</div>
              <div className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium text-fg" style={{ borderColor: S.color }}>
                <Icon className="size-4" style={{ color: S.color }} /> {S.label}
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: `color-mix(in oklab, ${S.color} 18%, transparent)` }}>
              <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${f.risk * 100}%`, background: S.color }} />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-subtle">
              <span>0</span>
              <span>warn 30</span>
              <span>alert 70</span>
              <span>100</span>
            </div>
          </div>

          {/* live features */}
          <dl className="grid grid-cols-2 gap-2">
            {[
              { k: "Vibration RMS", v: `${f.vibMean.toFixed(2)} mm/s` },
              { k: "Vibration peak", v: `${f.vibPeak.toFixed(2)} mm/s` },
              { k: "Temperature", v: `${f.temp.toFixed(1)} °C` },
              { k: "Temp trend", v: `${f.tempSlope >= 0 ? "+" : ""}${f.tempSlope.toFixed(2)} °C/s` },
              { k: "Current", v: `${f.curMean.toFixed(1)} A` },
              { k: "Spindle speed", v: `${Math.round(data[data.length - 1]?.rpm ?? 3000)} rpm` },
            ].map((x) => (
              <div key={x.k} className="rounded-xl border border-line bg-bg/40 px-3 py-2">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-subtle">{x.k}</dt>
                <dd className="mt-0.5 font-mono text-sm text-fg tabular-nums">{x.v}</dd>
              </div>
            ))}
          </dl>

          {/* events */}
          <div>
            <PanelTitle>Event log</PanelTitle>
            <ul className="space-y-1.5">
              {events.length === 0 && <li className="text-xs text-subtle">No alerts yet. Inject a fault above.</li>}
              {events.map((e) => {
                const E = STATUS[e.s];
                const EI = E.icon;
                return (
                  <li key={e.t} className="flex items-start gap-2 text-xs">
                    <EI className="mt-0.5 size-3.5 shrink-0" style={{ color: E.color }} />
                    <span className="font-mono text-subtle tabular-nums">t+{e.t.toFixed(1)}s</span>
                    <span className="text-fg">{E.label}:</span>
                    <span className="text-muted">{e.why}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <LabNote>
          Simulated sensor streams and a lightweight scoring model, to show the pipeline: live signals → sliding-window features → a failure score. The real
          CNC project collected live vibration, temperature, spindle-speed and current data and trained an XGBoost classifier that reached 95% accuracy.
        </LabNote>
      </div>
    </div>
  );
}

function FaultButton({ onClick, active, icon, children }: { onClick: () => void; active: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs transition-colors ${
        active ? "border-status-critical/60 bg-status-critical/10 text-fg" : "border-line bg-bg/40 text-muted hover:border-line-strong hover:text-fg"
      }`}
    >
      {icon} {children}
    </button>
  );
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function LineChart({
  title,
  unit,
  data,
  field,
  color,
  min,
  max,
  alert,
  digits,
}: {
  title: string;
  unit: string;
  data: Sample[];
  field: "vib" | "temp";
  color: string;
  min: number;
  max: number;
  alert: number;
  digits: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = 150;
  const padL = 34;
  const padR = 64;
  const padT = 10;
  const padB = 22;
  const iw = Math.max(10, width - padL - padR);
  const ih = H - padT - padB;
  const x = (i: number) => padL + (i / (WINDOW - 1)) * iw;
  const y = (v: number) => padT + ih - ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * ih;
  const offset = WINDOW - data.length;
  const pts = data.map((s, i) => `${x(i + offset).toFixed(1)},${y(s[field]).toFixed(1)}`);
  const line = pts.length ? `M ${pts.join(" L ")}` : "";
  const area = pts.length ? `${line} L ${x(WINDOW - 1)},${padT + ih} L ${x(offset)},${padT + ih} Z` : "";
  const last = data[data.length - 1];
  const ticks = [min, (min + max) / 2, max];
  const hv = hover !== null ? data[hover - offset] : null;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - padL) / iw) * (WINDOW - 1));
    setHover(i >= offset && i < WINDOW ? i : null);
  };

  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium text-fg">
          {title} <span className="font-normal text-subtle">({unit})</span>
        </span>
        <span className="font-mono text-[10.5px] text-subtle">last 15 s · 10 Hz</span>
      </div>
      <div ref={ref} className="relative">
        <svg width="100%" height={H} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={`${title} live chart, latest ${last?.[field].toFixed(digits)} ${unit}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={padL + iw} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
              <text x={padL - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-[var(--subtle)] font-mono text-[10px]">
                {t}
              </text>
            </g>
          ))}
          {/* alert level reference */}
          <line x1={padL} x2={padL + iw} y1={y(alert)} y2={y(alert)} stroke="var(--status-warning)" strokeWidth={1} opacity={0.8} />
          <text x={padL + 4} y={y(alert) - 5} className="fill-[var(--muted)] text-[10px]">
            alert level {alert}
          </text>
          <path d={area} fill={color} opacity={0.1} />
          <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {last && (
            <>
              <circle cx={x(WINDOW - 1)} cy={y(last[field])} r={4} fill={color} stroke="var(--bg-elev)" strokeWidth={2} />
              <text x={x(WINDOW - 1) + 9} y={y(last[field])} dominantBaseline="middle" className="fill-[var(--fg)] font-mono text-[11px]">
                {last[field].toFixed(digits)}
              </text>
            </>
          )}
          <text x={padL} y={H - 4} className="fill-[var(--subtle)] font-mono text-[10px]">
            −15s
          </text>
          <text x={padL + iw} y={H - 4} textAnchor="end" className="fill-[var(--subtle)] font-mono text-[10px]">
            now
          </text>
          {hv && hover !== null && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + ih} stroke="var(--muted)" strokeWidth={1} />
              <circle cx={x(hover)} cy={y(hv[field])} r={4} fill={color} stroke="var(--bg-elev)" strokeWidth={2} />
            </>
          )}
        </svg>
        {hv && hover !== null && (
          <div
            className="pointer-events-none absolute top-1 z-10 rounded-lg border border-line-strong bg-elev px-2.5 py-1.5 text-xs shadow-xl"
            style={{ left: Math.min(x(hover) + 10, width - 150) }}
          >
            <div className="font-semibold text-fg">
              {hv[field].toFixed(digits)} {unit}
            </div>
            <div className="flex items-center gap-1.5 text-muted">
              <span className="inline-block h-0.5 w-3 rounded" style={{ background: color }} /> {title}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-subtle">
              t−{((WINDOW - 1 - hover) / 10).toFixed(1)}s · risk {Math.round(hv.risk * 100)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
