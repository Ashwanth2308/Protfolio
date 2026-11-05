import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Ban, Check, CircleCheck, Eraser, FlaskConical, Play, ShieldAlert, ShieldCheck, ShieldHalf, Workflow } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { explain } from "../lib/assistant";
import { attackPresets, scan, type ScanResult } from "../lib/guardrail";
import { Reveal, RichText, Section } from "./ui";

type Tab = "guard" | "rag";

export default function AILab() {
  const [tab, setTab] = useState<Tab>("guard");
  return (
    <Section
      id="lab"
      index="04"
      eyebrow="AI Lab"
      title={
        <>
          Don't take my word for it. <span className="text-gradient">Try it.</span>
        </>
      }
      subtitle="Two live demos running in your browser: a mini LLM security gateway, and a step-by-step view of the retrieval pipeline behind my assistant."
    >
      <Reveal>
        <div className="mb-5 grid gap-3 sm:grid-cols-2" role="tablist" aria-label="AI Lab demos">
          <TabButton
            active={tab === "guard"}
            onClick={() => setTab("guard")}
            icon={<ShieldHalf className="size-5" />}
            title="Guardrail playground"
            sub="Try to jailbreak an LLM gateway"
          />
          <TabButton
            active={tab === "rag"}
            onClick={() => setTab("rag")}
            icon={<Workflow className="size-5" />}
            title="RAG under the hood"
            sub="Watch retrieval run step by step"
          />
        </div>
      </Reveal>
      <Reveal delay={0.05}>
        <div className="ring-gradient relative overflow-hidden rounded-3xl border border-line bg-elev/70 shadow-2xl shadow-black/30 light:shadow-slate-200">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 font-mono text-[11px] text-subtle">
              {tab === "guard" ? "~/lab/llm-gateway — playground" : "~/lab/rag — pipeline inspector"}
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-subtle">
              <FlaskConical className="size-3 text-accent" /> runs locally
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {tab === "guard" ? <GuardrailLab /> : <RagLab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </Reveal>
    </Section>
  );
}

function TabButton({ active, onClick, icon, title, sub }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
        active ? "border-accent/50 bg-accent/[0.08] shadow-lg shadow-accent/10" : "border-line bg-card hover:border-line-strong"
      }`}
    >
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl border ${active ? "border-accent/50 bg-accent text-accent-ink" : "border-line bg-bg/40 text-accent"}`}>
        {icon}
      </span>
      <span>
        <span className="block font-display text-base font-semibold text-fg">{title}</span>
        <span className="block text-sm text-muted">{sub}</span>
      </span>
    </button>
  );
}

/* ───────────────────────── Guardrail playground ───────────────────────── */

const verdictStyle: Record<ScanResult["verdict"], { label: string; cls: string; icon: React.ReactNode; line: string }> = {
  ALLOW: { label: "Allowed", cls: "border-ok/40 bg-ok/10 text-ok", icon: <ShieldCheck className="size-6" />, line: "Request passes to the model." },
  REDACT: { label: "Redacted", cls: "border-warn/40 bg-warn/10 text-warn", icon: <ShieldAlert className="size-6" />, line: "Sensitive data masked before it reaches the model." },
  BLOCK: { label: "Blocked", cls: "border-danger/40 bg-danger/10 text-danger", icon: <Ban className="size-6" />, line: "Attack stopped. Nothing reaches the model." },
};

const sevDot = { low: "bg-accent-3", medium: "bg-warn", high: "bg-danger" } as const;

function GuardrailLab() {
  const [text, setText] = useState(attackPresets[1].text);
  const deferred = useDeferredValue(text);
  const r = useMemo(() => scan(deferred), [deferred]);
  const v = verdictStyle[r.verdict];

  return (
    <div className="grid gap-0 lg:grid-cols-2">
      {/* input */}
      <div className="border-b border-line p-5 lg:border-r lg:border-b-0 md:p-6">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">1 · Send a prompt</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {attackPresets.map((p) => (
            <button
              key={p.label}
              onClick={() => setText(p.text)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                text === p.text ? "border-accent/60 bg-accent/10 text-fg" : "border-line bg-bg/40 text-muted hover:text-fg"
              }`}
            >
              <span className={`size-1.5 rounded-full ${p.kind === "safe" ? "bg-ok" : "bg-danger"}`} />
              {p.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full resize-none rounded-xl border border-line bg-bg/60 p-4 pr-10 font-mono text-[12.5px] leading-relaxed text-fg focus:border-accent/60 focus:outline-none"
            aria-label="Prompt to scan"
            placeholder="Type anything, or try to sneak an instruction past the gateway…"
          />
          {text && (
            <button onClick={() => setText("")} className="absolute top-3 right-3 text-subtle hover:text-fg" aria-label="Clear prompt">
              <Eraser className="size-4" />
            </button>
          )}
        </div>
        <p className="mt-2 font-mono text-[10.5px] text-subtle">Scans as you type · {r.rules} detectors · {r.ms.toFixed(2)}ms</p>

        <p className="mt-6 mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">3 · What reaches the model</p>
        <div className="min-h-[88px] rounded-xl border border-line bg-bg/60 p-4 font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-words">
          {r.verdict === "BLOCK" ? (
            <span className="text-danger">∅ request dropped · logged for review</span>
          ) : text ? (
            <Sanitized text={r.sanitized} />
          ) : (
            <span className="text-subtle">…</span>
          )}
        </div>
      </div>

      {/* verdict */}
      <div className="p-5 md:p-6">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">2 · Gateway decision</p>
        <motion.div
          key={r.verdict}
          initial={{ scale: 0.97, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`flex items-center gap-4 rounded-2xl border p-4 ${v.cls}`}
        >
          {v.icon}
          <div className="min-w-0 flex-1">
            <div className="font-display text-2xl font-semibold tracking-tight">{v.label}</div>
            <div className="text-sm text-fg/80">{v.line}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-semibold tabular-nums">{r.risk}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-80">risk</div>
          </div>
        </motion.div>

        <div className="mt-3 flex gap-1" aria-hidden="true">
          {Array.from({ length: 20 }, (_, i) => {
            const on = i < Math.round(r.risk / 5);
            const c = i < 8 ? "bg-ok" : i < 14 ? "bg-warn" : "bg-danger";
            return <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${on ? c : "bg-line"}`} />;
          })}
        </div>

        <div className="mt-5 space-y-2">
          <AnimatePresence initial={false}>
            {r.findings.length === 0 ? (
              <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 rounded-xl border border-line bg-bg/40 p-4 text-sm text-muted">
                <CircleCheck className="size-4 text-ok" /> No threats detected across injection, jailbreak, leakage, PII and tool-use checks.
              </motion.div>
            ) : (
              r.findings.map((f) => (
                <motion.div
                  key={f.detector}
                  layout
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-line bg-bg/40 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`size-2 rounded-full ${sevDot[f.severity]}`} />
                    <span className="text-sm font-medium text-fg">{f.detector}</span>
                    <span className="ml-auto rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted">
                      OWASP {f.owasp} · {f.owaspName}
                    </span>
                  </div>
                  <div className="mt-1.5 truncate font-mono text-[11px] text-subtle">“{f.match}”</div>
                  {f.note && <div className="mt-1 text-xs text-muted">{f.note}</div>}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-subtle">
          A small rule-based version of the idea behind the LLM Agent Security Gateway I built at work. The production gateway goes further than pattern matching.
        </p>
      </div>
    </div>
  );
}

function Sanitized({ text }: { text: string }) {
  const parts = text.split(/(\[[A-Z]+\])/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\[[A-Z]+\]$/.test(p) ? (
          <span key={i} className="rounded bg-warn/15 px-1 text-warn">
            {p}
          </span>
        ) : (
          <span key={i} className="text-muted">
            {p}
          </span>
        ),
      )}
    </>
  );
}

/* ───────────────────────── RAG pipeline inspector ───────────────────────── */

const ragSamples = ["Which vector databases does he use?", "Has he fine-tuned models?", "Tell me about the insurance project", "Does he know Kubernetes?"];

function RagLab() {
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
