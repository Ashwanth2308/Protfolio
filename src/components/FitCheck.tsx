import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRightLeft, Check, CircleAlert, ClipboardCopy, FileSearch, Loader2, Mail, ScanSearch, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { profile } from "../data/portfolio";
import { useCopy } from "../hooks/hooks";
import { analyzeJD, reportToText, sampleJDs, type FitReport } from "../lib/fit";
import { track } from "../lib/analytics";
import { Reveal, Section } from "./ui";

const stages = ["Extracting skills", "Mapping to evidence", "Scoring coverage"];

export default function FitCheck() {
  const reduce = useReducedMotion();
  const [jd, setJd] = useState("");
  const [report, setReport] = useState<FitReport | null>(null);
  const [stage, setStage] = useState(-1);
  const { copied, copy } = useCopy();
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = (text = jd) => {
    if (!text.trim()) return;
    timers.current.forEach(clearTimeout);
    setReport(null);
    const r = analyzeJD(text);
    track("fit_check", { score: r.score, verdict: r.verdict });
    if (reduce) {
      setReport(r);
      return;
    }
    setStage(0);
    timers.current = [
      window.setTimeout(() => setStage(1), 380),
      window.setTimeout(() => setStage(2), 760),
      window.setTimeout(() => {
        setStage(-1);
        setReport(r);
      }, 1150),
    ];
  };

  const loadSample = (text: string) => {
    setJd(text);
    run(text);
  };

  const mailto = report
    ? `mailto:${profile.email}?subject=${encodeURIComponent(`Opportunity: ${report.role}`)}&body=${encodeURIComponent(
        `Hi Ashwanth,\n\nI came across your portfolio and would like to talk about a role.\n\n--- Fit check from your site ---\n${reportToText(report)}\n`,
      )}`
    : `mailto:${profile.email}`;

  return (
    <Section
      id="fit"
      index="07"
      eyebrow="Hiring?"
      title={
        <>
          Check my fit for <span className="text-gradient">your role</span>.
        </>
      }
      subtitle="Paste a job description. A skill extractor running in your browser maps every requirement to evidence from my work, and shows the gaps too."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        {/* input */}
        <Reveal>
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <FileSearch className="size-4 text-accent" />
              <span className="font-mono text-xs text-muted">job-description.txt</span>
              {jd && (
                <button
                  onClick={() => {
                    setJd("");
                    setReport(null);
                  }}
                  className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[11px] text-subtle hover:text-fg"
                >
                  <X className="size-3" /> clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 px-4 pt-4">
              <span className="font-mono text-[11px] text-subtle">Try a sample:</span>
              {sampleJDs.map((s) => (
                <button
                  key={s.label}
                  onClick={() => loadSample(s.text)}
                  className="rounded-full border border-line bg-bg/40 px-3 py-1 text-xs text-muted transition-colors hover:border-accent/50 hover:text-fg"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder={"Paste the job description here…\n\ne.g. “We're hiring an AI Engineer with experience in RAG, LangGraph, vector databases and AWS…”"}
              className="m-4 min-h-[260px] flex-1 resize-none rounded-xl border border-line bg-bg/50 p-4 font-mono text-[12.5px] leading-relaxed text-fg placeholder:text-subtle focus:border-accent/60 focus:outline-none"
              aria-label="Job description"
            />
            <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
              <button
                onClick={() => run()}
                disabled={!jd.trim() || stage >= 0}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40"
              >
                {stage >= 0 ? <Loader2 className="size-4 animate-spin" /> : <ScanSearch className="size-4" />}
                Analyze fit
              </button>
              <span className="text-xs text-subtle">Runs locally. Nothing you paste leaves this page.</span>
            </div>
          </div>
        </Reveal>

        {/* output */}
        <Reveal delay={0.08}>
          <div className="ring-gradient relative h-full min-h-[460px] overflow-hidden rounded-2xl border border-line bg-card p-5 md:p-6">
            <AnimatePresence mode="wait">
              {stage >= 0 ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid h-full place-items-center">
                  <ol className="space-y-3 font-mono text-sm">
                    {stages.map((s, i) => (
                      <li key={s} className={`flex items-center gap-3 ${i <= stage ? "text-fg" : "text-subtle"}`}>
                        {i < stage ? (
                          <Check className="size-4 text-ok" />
                        ) : i === stage ? (
                          <Loader2 className="size-4 animate-spin text-accent" />
                        ) : (
                          <span className="size-4 rounded-full border border-line-strong" />
                        )}
                        {s}…
                      </li>
                    ))}
                  </ol>
                </motion.div>
              ) : report ? (
                <Result key="report" r={report} mailto={mailto} copied={copied} onCopy={() => copy(reportToText(report))} />
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-6 grid size-16 place-items-center rounded-2xl border border-line bg-gradient-to-br from-accent/20 to-accent-2/15 text-accent">
                    <Sparkles className="size-7" />
                  </div>
                  <p className="font-display text-xl font-semibold text-fg">Your fit report appears here</p>
                  <p className="mt-2 max-w-sm text-sm text-muted">
                    Skill match score, the evidence behind each requirement, transferable skills, honest gaps, and checks for experience, degree and location.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] text-subtle">
                    {["extract", "map → evidence", "score", "report"].map((s, i, a) => (
                      <span key={s} className="flex items-center gap-2">
                        <span className="rounded-md border border-line bg-bg/40 px-2 py-1">{s}</span>
                        {i < a.length - 1 && <span className="text-accent">→</span>}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function Gauge({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? "var(--ok)" : score >= 60 ? "var(--accent)" : score >= 40 ? "var(--warn)" : "var(--danger)";
  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="9" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-4xl font-semibold text-fg tabular-nums">{score}%</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-subtle">skill match</div>
        </div>
      </div>
    </div>
  );
}

function Result({ r, mailto, copied, onCopy }: { r: FitReport; mailto: string; copied: boolean; onCopy: () => void }) {
  const evidence = r.matched.filter((m) => m.evidence.length).slice(0, 4);
  return (
    <motion.div key="r" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <Gauge score={r.score} />
        <div className="min-w-0 text-center sm:text-left">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">Fit report</p>
          <h3 className="mt-1 font-display text-2xl font-semibold text-fg">{r.verdict}</h3>
          <p className="mt-1 truncate text-sm text-muted">for “{r.role}”</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 font-mono text-[11px] sm:justify-start">
            <span className="rounded-full border border-ok/40 bg-ok/10 px-2.5 py-1 text-ok">{r.matched.length} matched</span>
            <span className="rounded-full border border-accent-3/40 bg-accent-3/10 px-2.5 py-1 text-accent-3">{r.transferable.length} transferable</span>
            <span className="rounded-full border border-danger/40 bg-danger/10 px-2.5 py-1 text-danger">{r.missing.length} gaps</span>
          </div>
        </div>
      </div>

      {r.notes.length > 0 && (
        <ul className="space-y-2">
          {r.notes.map((n) => (
            <li key={n.label} className="flex gap-3 rounded-xl border border-line bg-bg/40 px-3 py-2.5 text-sm">
              {n.status === "ok" ? (
                <Check className="mt-0.5 size-4 shrink-0 text-ok" />
              ) : (
                <CircleAlert className={`mt-0.5 size-4 shrink-0 ${n.status === "warn" ? "text-warn" : "text-accent-3"}`} />
              )}
              <span>
                <span className="font-medium text-fg">{n.label}:</span> <span className="text-muted">{n.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {r.matched.length > 0 && (
        <div>
          <h4 className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Matched requirements</h4>
          <div className="flex flex-wrap gap-1.5">
            {r.matched.map((m) => (
              <span
                key={m.skill.id}
                title={m.evidence.length ? `Evidence: ${m.evidence.join(", ")}` : undefined}
                className="inline-flex items-center gap-1 rounded-lg border border-ok/30 bg-ok/[0.07] px-2 py-1 text-xs text-fg"
              >
                <Check className="size-3 text-ok" />
                {m.skill.label}
              </span>
            ))}
          </div>
          {evidence.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {evidence.map((m) => (
                <li key={m.skill.id} className="flex gap-2 text-xs text-muted">
                  <span className="shrink-0 font-medium text-fg">{m.skill.label}</span>
                  <span className="text-subtle">→</span>
                  <span className="min-w-0 truncate">{m.evidence.slice(0, 2).join(" · ")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {r.transferable.length > 0 && (
        <div>
          <h4 className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Transferable</h4>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {r.transferable.map((m) => (
              <li key={m.skill.id} className="flex items-center gap-2 rounded-lg border border-line bg-bg/40 px-2.5 py-1.5 text-xs">
                <ArrowRightLeft className="size-3 shrink-0 text-accent-3" />
                <span className="min-w-0 truncate">
                  <span className="text-fg">{m.skill.label}</span> <span className="text-subtle">via {m.via?.join(", ")}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {r.missing.length > 0 && (
        <div>
          <h4 className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Gaps (honestly)</h4>
          <div className="flex flex-wrap gap-1.5">
            {r.missing.map((m) => (
              <span key={m.skill.id} className="rounded-lg border border-danger/30 bg-danger/[0.07] px-2 py-1 text-xs text-muted">
                {m.skill.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-line pt-5">
        <a href={mailto} className="inline-flex items-center gap-2 rounded-xl bg-fg px-4 py-2.5 text-sm font-medium text-bg transition-transform hover:-translate-y-0.5">
          <Mail className="size-4" /> Email Ashwanth about this role
        </a>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:border-accent/60"
        >
          {copied ? <Check className="size-4 text-ok" /> : <ClipboardCopy className="size-4" />}
          {copied ? "Copied" : "Copy report"}
        </button>
        <span className="w-full font-mono text-[10.5px] text-subtle">
          {r.found} requirements detected · analyzed in {r.ms.toFixed(1)}ms · keyword-based, so treat it as a starting point
        </span>
      </div>
    </motion.div>
  );
}
