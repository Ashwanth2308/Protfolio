import { AnimatePresence, motion } from "motion/react";
import { Dices, RotateCcw, Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { Chip, LabNote, PanelTitle, Slider } from "./shared";

type Ctx = { id: string; prompt: string; tokens: { t: string; logit: number }[] };

// Illustrative next-token logits. The decoding math below is the real thing.
const contexts: Ctx[] = [
  {
    id: "rag",
    prompt: "To reduce hallucinations, a RAG system should",
    tokens: [
      { t: "cite its sources", logit: 3.1 },
      { t: "retrieve better context", logit: 2.8 },
      { t: "use guardrails", logit: 2.2 },
      { t: "re-rank results", logit: 1.8 },
      { t: "say “I don't know”", logit: 1.5 },
      { t: "lower the temperature", logit: 1.0 },
      { t: "guess confidently", logit: -0.6 },
      { t: "ignore the context", logit: -1.3 },
      { t: "invent numbers", logit: -1.9 },
    ],
  },
  {
    id: "agent",
    prompt: "Before an AI agent runs a tool, it should",
    tokens: [
      { t: "validate the arguments", logit: 3.0 },
      { t: "check permissions", logit: 2.7 },
      { t: "ask for confirmation", logit: 2.1 },
      { t: "log the call", logit: 1.8 },
      { t: "sandbox the call", logit: 1.4 },
      { t: "rate-limit itself", logit: 0.9 },
      { t: "just run it", logit: -0.8 },
      { t: "disable logging", logit: -2.0 },
      { t: "skip every check", logit: -2.3 },
    ],
  },
  {
    id: "vector",
    prompt: "For this RAG prototype, the vector store will be",
    tokens: [
      { t: "FAISS", logit: 2.3 },
      { t: "Pinecone", logit: 2.2 },
      { t: "ChromaDB", logit: 2.0 },
      { t: "MongoDB Atlas", logit: 1.8 },
      { t: "pgvector", logit: 1.7 },
      { t: "Qdrant", logit: 1.3 },
      { t: "Weaviate", logit: 1.2 },
      { t: "a spreadsheet", logit: -1.1 },
      { t: "a sticky note", logit: -2.4 },
    ],
  },
];

function decode(tokens: Ctx["tokens"], T: number, k: number, p: number) {
  const t = Math.max(T, 0.01);
  const m = Math.max(...tokens.map((x) => x.logit / t));
  const ex = tokens.map((x) => Math.exp(x.logit / t - m));
  const Z = ex.reduce((a, b) => a + b, 0);
  const probs = ex.map((e) => e / Z);
  const order = probs.map((pr, i) => ({ pr, i })).sort((a, b) => b.pr - a.pr);
  const keep = new Set<number>();
  const cutBy: Record<number, "top-k" | "top-p"> = {};
  let cum = 0;
  order.forEach(({ pr, i }, rank) => {
    if (rank >= k) cutBy[i] = "top-k";
    else if (cum >= p) cutBy[i] = "top-p";
    else keep.add(i);
    cum += pr;
  });
  const kept = [...keep].reduce((a, i) => a + probs[i], 0) || 1;
  const final = probs.map((pr, i) => (keep.has(i) ? pr / kept : 0));
  const H = -final.reduce((a, q) => (q > 0 ? a + q * Math.log2(q) : a), 0);
  return { probs, final, cutBy, H, keep };
}

export default function DecodeLab() {
  const [ctxId, setCtxId] = useState(contexts[0].id);
  const [T, setT] = useState(0.8);
  const [k, setK] = useState(6);
  const [p, setP] = useState(0.9);
  const [samples, setSamples] = useState<number[]>([]);
  const [last, setLast] = useState<number | null>(null);
  const [tip, setTip] = useState<number | null>(null);
  const ctx = contexts.find((c) => c.id === ctxId)!;
  const d = useMemo(() => decode(ctx.tokens, T, k, p), [ctx, T, k, p]);

  const counts = useMemo(() => {
    const c = new Array(ctx.tokens.length).fill(0);
    for (const s of samples) c[s]++;
    return c;
  }, [samples, ctx]);

  const drawOne = () => {
    let r = Math.random();
    for (let i = 0; i < d.final.length; i++) {
      r -= d.final[i];
      if (r <= 0 && d.final[i] > 0) return i;
    }
    return d.final.findIndex((x) => x > 0);
  };
  const sample = (n: number) => {
    const draws = Array.from({ length: n }, drawOne);
    setSamples((s) => [...s, ...draws].slice(-200));
    setLast(draws[draws.length - 1]);
  };
  const reset = () => {
    setSamples([]);
    setLast(null);
  };
  const change = (fn: () => void) => {
    fn();
    reset();
  };

  const maxP = Math.max(...d.final, ...d.probs);
  const effective = Math.pow(2, d.H);

  return (
    <div className="p-5 md:p-6">
      <div className="flex flex-wrap gap-1.5">
        {contexts.map((c) => (
          <Chip key={c.id} active={ctxId === c.id} onClick={() => change(() => setCtxId(c.id))}>
            {c.prompt}…
          </Chip>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-bg/50 p-4 font-mono text-sm leading-relaxed">
        <span className="text-subtle">prompt › </span>
        <span className="text-fg">{ctx.prompt} </span>
        <AnimatePresence mode="wait">
          {last !== null ? (
            <motion.span
              key={`${last}-${samples.length}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded bg-accent/15 px-1 text-accent"
            >
              {ctx.tokens[last].t}
            </motion.span>
          ) : (
            <span className="animate-blink text-accent">▍</span>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="space-y-5">
          <PanelTitle n={1}>Decoding settings</PanelTitle>
          <Slider
            label="Temperature"
            value={T}
            min={0.05}
            max={2}
            step={0.05}
            onChange={(v) => change(() => setT(v))}
            format={(v) => v.toFixed(2)}
            hint="Divides the logits before softmax. Low = sharper and more predictable, high = flatter and more creative."
          />
          <Slider label="Top-k" value={k} min={1} max={ctx.tokens.length} onChange={(v) => change(() => setK(v))} hint="Keep only the k most likely tokens." />
          <Slider
            label="Top-p (nucleus)"
            value={p}
            min={0.1}
            max={1}
            step={0.05}
            onChange={(v) => change(() => setP(v))}
            format={(v) => v.toFixed(2)}
            hint="Keep the smallest set of tokens whose probabilities add up to p."
          />
          <dl className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-line bg-bg/40 px-3 py-2.5">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-subtle">Candidates kept</dt>
              <dd className="mt-0.5 font-display text-lg font-semibold text-fg">
                {d.keep.size} / {ctx.tokens.length}
              </dd>
            </div>
            <div className="rounded-xl border border-line bg-bg/40 px-3 py-2.5">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-subtle">Entropy</dt>
              <dd className="mt-0.5 font-display text-lg font-semibold text-fg">
                {d.H.toFixed(2)} bits <span className="text-xs font-normal text-muted">≈ {effective.toFixed(1)} choices</span>
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => sample(1)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink">
              <Dices className="size-4" /> Sample 1
            </button>
            <button onClick={() => sample(50)} className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-4 py-2.5 text-sm font-medium text-fg hover:border-accent/60">
              <Shuffle className="size-4" /> Sample 50
            </button>
            {samples.length > 0 && (
              <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs text-subtle hover:text-fg">
                <RotateCcw className="size-3.5" /> reset
              </button>
            )}
          </div>
        </div>

        {/* distribution chart */}
        <div>
          <PanelTitle n={2} meta={samples.length ? `${samples.length} samples drawn` : "probability after filtering"}>
            Next-token distribution
          </PanelTitle>
          <div className="relative" role="table" aria-label="Next token probabilities">
            {ctx.tokens.map((tok, i) => {
              const kept = d.final[i] > 0;
              const share = samples.length ? counts[i] / samples.length : null;
              return (
                <div
                  key={tok.t}
                  role="row"
                  tabIndex={0}
                  onMouseEnter={() => setTip(i)}
                  onMouseLeave={() => setTip(null)}
                  onFocus={() => setTip(i)}
                  onBlur={() => setTip(null)}
                  className={`relative grid grid-cols-[minmax(0,9.5rem)_1fr_3.2rem] items-center gap-3 rounded-lg px-1 py-[7px] outline-none sm:grid-cols-[minmax(0,12rem)_1fr_3.4rem] ${tip === i ? "bg-card" : ""}`}
                >
                  <span role="cell" className={`truncate text-[13px] ${kept ? "text-fg" : "text-subtle line-through decoration-subtle/60"}`}>
                    {tok.t}
                  </span>
                  <span role="cell" className="relative h-[14px]">
                    {/* raw probability ghost */}
                    <span className="absolute inset-y-0 left-0 rounded-r-[4px] bg-line" style={{ width: `${(d.probs[i] / maxP) * 100}%` }} />
                    {/* filtered, renormalized probability */}
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-r-[4px] bg-series-1"
                      animate={{ width: `${(d.final[i] / maxP) * 100}%` }}
                      transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    />
                    {share !== null && share > 0 && (
                      <span
                        className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-fg"
                        style={{ left: `${Math.min(100, (share / maxP) * 100)}%`, borderColor: "var(--bg-elev)" }}
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span role="cell" className="text-right font-mono text-xs text-muted tabular-nums">
                    {kept ? `${(d.final[i] * 100).toFixed(1)}%` : d.cutBy[i]}
                  </span>
                  {tip === i && (
                    <div className="pointer-events-none absolute top-full left-1/3 z-10 mt-1 rounded-lg border border-line-strong bg-elev px-3 py-2 text-xs shadow-xl">
                      <div className="font-semibold text-fg">{kept ? `${(d.final[i] * 100).toFixed(1)}%` : "excluded"}</div>
                      <div className="text-muted">“{tok.t}”</div>
                      <div className="mt-1 font-mono text-[10.5px] text-subtle">
                        logit {tok.logit.toFixed(1)} · softmax {(d.probs[i] * 100).toFixed(1)}%{share !== null ? ` · sampled ${counts[i]}×` : ""}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-4 rounded-sm bg-series-1" /> after temperature, top-k, top-p
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-4 rounded-sm bg-line" /> softmax before filtering
            </span>
            {samples.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-full bg-fg" /> share of samples
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <LabNote>
          The logits are illustrative, but the decoding is the real math: softmax with temperature, then top-k and nucleus (top-p) filtering, then
          renormalize and sample. Set temperature near 0 and the model always picks the top token (greedy).
        </LabNote>
      </div>
    </div>
  );
}
