import { motion, useReducedMotion } from "motion/react";
import { Ban, Check, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { explain } from "../../lib/assistant";
import { RichText } from "../ui";

/* ───────────────────────── RAG pipeline inspector ───────────────────────── */

const ragSamples = ["Which vector databases does he use?", "Has he fine-tuned models?", "Tell me about the insurance project", "Does he know Kubernetes?"];

export default function RagLab() {
  const reduce = useReducedMotion();
  const [q, setQ] = useState(ragSamples[0]);
  const [run, setRun] = useState({ q: ragSamples[0], n: 0 });
  const [step, setStep] = useState(reduce ? 5 : 0);
  const timers = useRef<number[]>([]);
  const e = useMemo(() => explain(run.q), [run]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    if (reduce) {
      setStep(5);
      return;
    }
    setStep(0);
    timers.current = [1, 2, 3, 4, 5].map((s) => window.setTimeout(() => setStep(s), s * 420));
    return () => timers.current.forEach(clearTimeout);
  }, [run, reduce]);

  const go = (x: string) => {
    setQ(x);
    setRun((r) => ({ q: x, n: r.n + 1 })); // n forces a re-run even for the same text
  };

  const max = e.ranked[0]?.score ?? 1;
  const top = e.ranked[0];
  const grounded = !!top && top.score >= e.threshold;

  return (
    <div className="p-5 md:p-6">
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          if (q.trim()) go(q);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={q}
          onChange={(ev) => setQ(ev.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-line bg-bg/60 px-4 py-3 font-mono text-sm text-fg focus:border-accent/60 focus:outline-none"
          placeholder="Ask anything about my work…"
          aria-label="Question for the RAG pipeline"
        />
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink">
          <Play className="size-4" /> Run pipeline
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ragSamples.map((s) => (
          <button key={s} onClick={() => go(s)} className="rounded-full border border-line bg-bg/40 px-2.5 py-1 text-xs text-muted hover:border-accent/50 hover:text-fg">
            {s}
          </button>
        ))}
      </div>

      <ol className="relative mt-7 space-y-3 before:absolute before:top-3 before:bottom-3 before:left-[15px] before:w-px before:bg-gradient-to-b before:from-accent before:via-accent-2/50 before:to-transparent">
        <Stage n={1} shown={step >= 1} title="Tokenize & normalize" meta="lowercase · strip stopwords · stem">
          <div className="flex flex-wrap gap-1.5">
            {e.raw.length ? (
              e.raw.map((t, i) => (
                <span key={t + i} className="rounded-md border border-line bg-bg/40 px-2 py-0.5 font-mono text-[11.5px] text-fg">
                  {t}
                </span>
              ))
            ) : (
              <span className="text-xs text-subtle">no content words</span>
            )}
          </div>
        </Stage>

        <Stage n={2} shown={step >= 2} title="Expand the query" meta="synonyms weighted ×0.45">
          <div className="flex flex-wrap gap-1.5">
            {e.expanded.map(({ t, w }) => (
              <span
                key={t}
                className={`rounded-md border px-2 py-0.5 font-mono text-[11.5px] ${w === 1 ? "border-line bg-bg/40 text-fg" : "border-accent-2/40 bg-accent-2/10 text-accent-2"}`}
              >
                {t}
                {w !== 1 && <span className="ml-1 opacity-70">×{w}</span>}
              </span>
            ))}
          </div>
        </Stage>

        <Stage n={3} shown={step >= 3} title="Retrieve with BM25" meta={`${e.candidates} chunks searched · top 5 · ${e.ms.toFixed(2)}ms`}>
          {e.ranked.length ? (
            <ul className="space-y-1.5">
              {e.ranked.map((r, i) => (
                <li key={r.chunk.id} className="grid grid-cols-[minmax(0,10rem)_1fr_3rem] items-center gap-3 text-xs sm:grid-cols-[minmax(0,14rem)_1fr_3rem]">
                  <span className={`truncate ${i === 0 ? "font-medium text-fg" : "text-muted"}`}>{r.chunk.title}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-line">
                    <motion.span
                      className={`block h-full rounded-full ${i === 0 ? "bg-gradient-to-r from-accent to-accent-3" : "bg-subtle/60"}`}
                      initial={{ width: 0 }}
                      animate={{ width: step >= 3 ? `${(r.score / max) * 100}%` : 0 }}
                      transition={{ duration: 0.6, delay: i * 0.06 }}
                    />
                  </span>
                  <span className="text-right font-mono text-subtle tabular-nums">{r.score.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-xs text-subtle">No chunk matched any query term.</span>
          )}
        </Stage>

        <Stage n={4} shown={step >= 4} title="Confidence gate" meta={`threshold ${e.threshold}`}>
          <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${grounded ? "border-ok/40 bg-ok/10 text-ok" : "border-warn/40 bg-warn/10 text-warn"}`}>
            {grounded ? <Check className="size-3.5" /> : <Ban className="size-3.5" />}
            {grounded
              ? `Top score ${top!.score.toFixed(2)} ≥ ${e.threshold}: answer from “${top!.chunk.title}”`
              : `Top score ${(top?.score ?? 0).toFixed(2)} < ${e.threshold}: refuse instead of guessing`}
          </div>
        </Stage>

        <Stage n={5} shown={step >= 5} title="Grounded answer" meta={e.reply.trace.method}>
          <div className="prose-chat rounded-xl border border-line bg-bg/40 p-4 text-sm leading-relaxed whitespace-pre-line text-muted">
            <RichText text={e.reply.answer} />
          </div>
        </Stage>
      </ol>
    </div>
  );
}

function Stage({ n, shown, title, meta, children }: { n: number; shown: boolean; title: string; meta: string; children: React.ReactNode }) {
  return (
    <li className="relative pl-11">
      <span
        className={`absolute top-2.5 left-0 grid size-8 place-items-center rounded-full border font-mono text-xs transition-colors duration-300 ${
          shown ? "border-accent bg-accent text-accent-ink" : "border-line-strong bg-bg text-subtle"
        }`}
      >
        {n}
      </span>
      <div className={`rounded-2xl border bg-card p-4 transition-all duration-500 ${shown ? "border-line opacity-100" : "border-line/50 opacity-35"}`}>
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-sm font-semibold text-fg">{title}</span>
          <span className="font-mono text-[10.5px] text-subtle">{meta}</span>
        </div>
        {shown ? children : <div className="h-6 animate-pulse rounded-md bg-line/60" />}
      </div>
    </li>
  );
}
