import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Heart, MapPin, RotateCcw, Timer, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Chip, LabNote, PanelTitle, Slider } from "./shared";

const DIMS = ["AI & tech", "Music", "Hiking", "Food", "Travel", "Fitness", "Art", "Gaming"];
const NAMES = ["Aditi", "Rohan", "Meera", "Kabir", "Sara", "Arjun", "Nisha", "Dev", "Ira", "Vikram", "Tara", "Neel", "Anya", "Kiran", "Zoya", "Rahul", "Leah", "Omar", "Priya", "Sam", "Maya", "Ishaan", "Riya", "Noah"];

// Seeded PRNG so the synthetic profiles are the same for every visitor.
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Person = { id: number; name: string; vec: number[]; km: number; hours: number };

const PEOPLE: Person[] = (() => {
  const r = mulberry32(42);
  return NAMES.map((name, id) => {
    const vec = DIMS.map(() => r() * 0.3);
    const strong = new Set<number>();
    while (strong.size < 2 + Math.floor(r() * 2)) strong.add(Math.floor(r() * DIMS.length));
    for (const s of strong) vec[s] = 0.65 + r() * 0.35;
    return { id, name, vec, km: Math.round(1 + r() * 44), hours: Math.round(r() * 96) };
  });
})();

const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
const norm = (a: number[]) => Math.sqrt(dot(a, a)) || 1;
const cosine = (a: number[], b: number[]) => dot(a, b) / (norm(a) * norm(b));

const initialPref = (sel: Set<number>): number[] => DIMS.map((_, i) => (sel.has(i) ? 1 : 0.08));

export default function RecsysLab() {
  const [selected, setSelected] = useState<Set<number>>(new Set([0, 2, 3]));
  const [start, setStart] = useState(() => initialPref(new Set([0, 2, 3])));
  const [pref, setPref] = useState(start);
  const [seen, setSeen] = useState<Map<number, "like" | "skip">>(new Map());
  const [log, setLog] = useState<string[]>([]);
  const [w, setW] = useState({ sim: 60, loc: 25, act: 15 });

  const toggle = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    if (!next.size) return;
    setSelected(next);
    const p = initialPref(next);
    setStart(p);
    setPref(p);
    setSeen(new Map());
    setLog([]);
  };

  const reset = () => {
    setPref(start);
    setSeen(new Map());
    setLog([]);
  };

  // Stage 1: vector retrieval
  const pool = PEOPLE.filter((p) => !seen.has(p.id));
  const retrieved = useMemo(
    () =>
      pool
        .map((p) => ({ p, sim: cosine(pref, p.vec) }))
        .sort((a, b) => b.sim - a.sim)
        .slice(0, 8),
    [pref, seen], // pool is derived from `seen`
  );

  // Stage 2: re-rank
  const total = w.sim + w.loc + w.act || 1;
  const ranked = retrieved
    .map(({ p, sim }) => {
      const loc = 1 - Math.min(p.km, 50) / 50;
      const act = 1 - Math.min(p.hours, 96) / 96;
      const parts = { sim: (w.sim / total) * sim, loc: (w.loc / total) * loc, act: (w.act / total) * act };
      return { p, sim, loc, act, parts, score: parts.sim + parts.loc + parts.act };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const feedback = (p: Person, kind: "like" | "skip") => {
    const next =
      kind === "like"
        ? pref.map((x, i) => Math.min(1, x + 0.35 * (p.vec[i] - x) + 0.08 * p.vec[i]))
        : pref.map((x, i) => Math.max(0.02, x - 0.3 * p.vec[i] * x));
    const delta = next.map((x, i) => x - pref[i]);
    const movers = delta
      .map((d, i) => ({ d, i }))
      .filter((m) => Math.abs(m.d) > 0.03)
      .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
      .slice(0, 2)
      .map((m) => `${m.d > 0 ? "+" : "−"}${DIMS[m.i]}`)
      .join(" ");
    setPref(next);
    setSeen(new Map(seen).set(p.id, kind));
    setLog((l) => [`${kind === "like" ? "♥ Liked" : "✕ Skipped"} ${p.name}${movers ? ` → ${movers}` : ""}`, ...l].slice(0, 5));
  };

  const top3 = pref
    .map((v, i) => ({ v, i }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3);
  const rankedIds = new Set(ranked.map((r) => r.p.id));
  const retrievedIds = new Set(retrieved.map((r) => r.p.id));

  return (
    <div className="p-5 md:p-6">
      <PanelTitle n={1}>Your interests</PanelTitle>
      <div className="flex flex-wrap gap-1.5">
        {DIMS.map((d, i) => (
          <Chip key={d} active={selected.has(i)} onClick={() => toggle(i)}>
            {d}
          </Chip>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        {/* left: pool + radar */}
        <div className="space-y-6">
          <div>
            <PanelTitle n={2} meta={`${pool.length} profiles → top 8 by cosine similarity`}>
              Stage 1 · vector retrieval
            </PanelTitle>
            <div className="grid grid-cols-8 gap-1.5">
              {PEOPLE.map((p) => {
                const state = seen.get(p.id);
                const inTop = rankedIds.has(p.id);
                const inRet = retrievedIds.has(p.id);
                return (
                  <span
                    key={p.id}
                    title={`${p.name}${state ? ` · ${state === "like" ? "liked" : "skipped"}` : inTop ? " · in top 5" : inRet ? " · retrieved" : ""}`}
                    className={`grid aspect-square place-items-center rounded-full border text-[10px] font-semibold transition-all duration-300 ${
                      state
                        ? "border-line text-subtle opacity-40"
                        : inTop
                          ? "border-accent bg-accent text-accent-ink"
                          : inRet
                            ? "border-accent/60 bg-accent/10 text-fg"
                            : "border-line bg-bg/40 text-subtle"
                    }`}
                  >
                    {state === "like" ? "♥" : state === "skip" ? "✕" : p.name.slice(0, 2)}
                  </span>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-accent" /> top 5 after re-rank
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full border border-accent/60 bg-accent/10" /> retrieved
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full border border-line" /> not retrieved
              </span>
            </div>
          </div>

          <div>
            <PanelTitle n={4} meta={`${seen.size} feedback events`}>
              Learned preference vector
            </PanelTitle>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Radar start={start} now={pref} />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex gap-4 text-[11px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded bg-series-1" /> learned
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded bg-subtle" /> start
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Strongest signals: {top3.map((t) => `${DIMS[t.i]} ${Math.round(t.v * 100)}%`).join(", ")}
                </p>
                <ul className="space-y-1 font-mono text-[11px] text-subtle">
                  <AnimatePresence initial={false}>
                    {log.map((l) => (
                      <motion.li key={l + log.length} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                        {l}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                  {!log.length && <li>Like or skip a match to train the vector.</li>}
                </ul>
                {seen.size > 0 && (
                  <button onClick={reset} className="inline-flex items-center gap-1.5 text-xs text-subtle hover:text-fg">
                    <RotateCcw className="size-3.5" /> reset feedback
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* right: re-rank */}
        <div>
          <PanelTitle n={3}>Stage 2 · re-rank</PanelTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            <Slider label="Similarity" value={w.sim} min={0} max={100} step={5} onChange={(v) => setW({ ...w, sim: v })} format={(v) => `${Math.round((v / total) * 100)}%`} />
            <Slider label="Distance" value={w.loc} min={0} max={100} step={5} onChange={(v) => setW({ ...w, loc: v })} format={(v) => `${Math.round((v / total) * 100)}%`} />
            <Slider label="Recent activity" value={w.act} min={0} max={100} step={5} onChange={(v) => setW({ ...w, act: v })} format={(v) => `${Math.round((v / total) * 100)}%`} />
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-series-1" /> similarity
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-series-2" /> distance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-series-3" /> recent activity
            </span>
          </div>

          <LayoutGroup>
            <ol className="mt-3 space-y-2">
              <AnimatePresence initial={false}>
                {ranked.map((r, i) => (
                  <motion.li
                    key={r.p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="rounded-xl border border-line bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-subtle">#{i + 1}</span>
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent/30 to-accent-2/30 text-xs font-semibold text-fg">
                        {r.p.name.slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-fg">{r.p.name}</span>
                          <span className="font-mono text-xs text-fg tabular-nums">{Math.round(r.score * 100)}</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted">
                          <span>sim {r.sim.toFixed(2)}</span>
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="size-3" /> {r.p.km} km
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <Timer className="size-3" /> {r.p.hours}h ago
                          </span>
                          <span className="truncate text-subtle">
                            {r.p.vec
                              .map((v, k) => ({ v, k }))
                              .filter((x) => x.v > 0.6)
                              .map((x) => DIMS[x.k])
                              .join(" · ")}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => feedback(r.p, "skip")} className="grid size-8 place-items-center rounded-full border border-line text-subtle hover:border-line-strong hover:text-fg" aria-label={`Skip ${r.p.name}`}>
                        <X className="size-4" />
                      </button>
                      <button onClick={() => feedback(r.p, "like")} className="grid size-8 place-items-center rounded-full bg-accent text-accent-ink" aria-label={`Like ${r.p.name}`}>
                        <Heart className="size-4" />
                      </button>
                    </div>
                    {/* thin segmented bar: contribution of each re-rank signal */}
                    <div
                      className="mt-2.5 flex h-2 gap-[2px]"
                      role="img"
                      aria-label={`score ${Math.round(r.score * 100)}: similarity ${Math.round(r.parts.sim * 100)}, distance ${Math.round(r.parts.loc * 100)}, activity ${Math.round(r.parts.act * 100)}`}
                      title={`similarity ${Math.round(r.parts.sim * 100)} · distance ${Math.round(r.parts.loc * 100)} · activity ${Math.round(r.parts.act * 100)}`}
                    >
                      {(["sim", "loc", "act"] as const).map((k, j) =>
                        r.parts[k] > 0.004 ? (
                          <span
                            key={k}
                            className={`h-full rounded-full transition-[width] duration-300 ${j === 0 ? "bg-series-1" : j === 1 ? "bg-series-2" : "bg-series-3"}`}
                            style={{ width: `${r.parts[k] * 100}%` }}
                          />
                        ) : null,
                      )}
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          </LayoutGroup>
          {ranked.length === 0 && <p className="mt-4 text-sm text-muted">You've seen everyone. Reset feedback to start over.</p>}
        </div>
      </div>

      <div className="mt-5">
        <LabNote>
          Modeled on the Nudr recommendation engine: retrieve candidates by embedding similarity (Pinecone in production), re-rank on location and recent
          activity, then learn from likes and skips. The 24 profiles are synthetic.
        </LabNote>
      </div>
    </div>
  );
}

function Radar({ start, now }: { start: number[]; now: number[] }) {
  const size = 260;
  const c = size / 2;
  const R = 82;
  const pt = (v: number, i: number) => {
    const a = (Math.PI * 2 * i) / DIMS.length - Math.PI / 2;
    return [c + Math.cos(a) * R * v, c + Math.sin(a) * R * v];
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(Math.max(0.04, v), i).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-[240px] shrink-0 overflow-visible" role="img" aria-label={`Preference vector: ${DIMS.map((d, i) => `${d} ${Math.round(now[i] * 100)}%`).join(", ")}`}>
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon key={r} points={poly(DIMS.map(() => r))} fill="none" stroke="var(--line)" strokeWidth={1} />
      ))}
      {DIMS.map((d, i) => {
        const [x, y] = pt(1, i);
        const [lx, ly] = pt(1.3, i);
        return (
          <g key={d}>
            <line x1={c} y1={c} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-[var(--muted)] text-[9px]">
              {d}
            </text>
          </g>
        );
      })}
      <polygon points={poly(start)} fill="none" stroke="var(--subtle)" strokeWidth={1.5} strokeLinejoin="round" />
      <motion.polygon
        animate={{ points: poly(now) }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        fill="color-mix(in oklab, var(--series-1) 12%, transparent)"
        stroke="var(--series-1)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {now.map((v, i) => {
        const [x, y] = pt(Math.max(0.04, v), i);
        return (
          <motion.circle key={i} animate={{ cx: x, cy: y }} transition={{ type: "spring", stiffness: 120, damping: 18 }} r={4} fill="var(--series-1)" stroke="var(--bg-elev)" strokeWidth={2}>
            <title>{`${DIMS[i]}: ${Math.round(v * 100)}%`}</title>
          </motion.circle>
        );
      })}
    </svg>
  );
}
