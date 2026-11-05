import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, CircleCheck, GitBranch, Lightbulb, Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { projects } from "../data/portfolio";
import { useLockBody } from "../hooks/hooks";
import { categoryIcon } from "./Projects";
import { Tag, useUI } from "./ui";

export default function ProjectModal({ id, onClose, onNavigate }: { id: string | null; onClose: () => void; onNavigate: (id: string) => void }) {
  const idx = projects.findIndex((p) => p.id === id);
  const p = idx >= 0 ? projects[idx] : null;
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { openChat } = useUI();
  useLockBody(!!p);

  useEffect(() => {
    if (!p) return;
    closeRef.current?.focus({ preventScroll: true });
    scrollRef.current?.scrollTo({ top: 0 });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate(projects[(idx + 1) % projects.length].id);
      if (e.key === "ArrowLeft") onNavigate(projects[(idx - 1 + projects.length) % projects.length].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p, idx, onClose, onNavigate]);

  const prev = projects[(idx - 1 + projects.length) % projects.length];
  const next = projects[(idx + 1) % projects.length];
  const Icon = p ? categoryIcon[p.category] : null;

  return (
    <AnimatePresence>
      {p && Icon && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-title"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm light:bg-slate-900/30" onClick={onClose} />
          <motion.div
            ref={scrollRef}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-h-[92svh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-line-strong bg-elev shadow-2xl sm:rounded-3xl"
          >
            {/* header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-elev/90 px-5 py-3 backdrop-blur sm:px-8">
              <span className="inline-flex min-w-0 items-center gap-2 font-mono text-[11px] text-muted">
                <Icon className="size-3.5 shrink-0 text-accent" />
                <span className="truncate">
                  {p.category} · {p.type}
                  {p.period ? ` · ${p.period}` : ""}
                </span>
              </span>
              <button
                ref={closeRef}
                onClick={onClose}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-fg"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-5 pt-7 pb-8 sm:px-8 sm:pt-9">
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <h3 id="project-title" className="font-display text-2xl font-semibold tracking-tight text-fg sm:text-4xl">
                  {p.title}
                </h3>
                <p className="mt-3 text-base text-accent sm:text-lg">{p.tagline}</p>

                <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto]">
                  <div>
                    <h4 className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">The problem</h4>
                    <p className="leading-relaxed text-muted">{p.problem}</p>
                  </div>
                  {p.metric && (
                    <div className="flex flex-col justify-center rounded-2xl border border-line bg-card px-6 py-4 md:min-w-44">
                      <span className="font-display text-3xl font-semibold text-gradient">{p.metric.value}</span>
                      <span className="mt-1 text-xs text-muted">{p.metric.label}</span>
                    </div>
                  )}
                </div>

                {/* architecture */}
                <h4 className="mt-10 mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">How it works</h4>
                <Pipeline steps={p.pipeline} />

                <h4 className="mt-10 mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">What I built</h4>
                <ul className="space-y-3">
                  {p.highlights.map((h, i) => (
                    <li key={i} className="flex gap-3 leading-relaxed text-muted">
                      <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/10 font-mono text-[10px] text-accent">
                        {i + 1}
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                {p.decisions && p.decisions.length > 0 && (
                  <>
                    <h4 className="mt-10 mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">Key decisions</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {p.decisions.map((d) => (
                        <div key={d.title} className="rounded-xl border border-line bg-card p-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-fg">
                            <GitBranch className="size-4 shrink-0 text-accent" /> {d.title}
                          </div>
                          <p className="mt-1.5 text-sm leading-relaxed text-muted">{d.body}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {p.results && p.results.length > 0 && (
                  <>
                    <h4 className="mt-10 mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">Results</h4>
                    <ul className="space-y-2">
                      {p.results.map((r) => (
                        <li key={r} className="flex gap-3 text-sm leading-relaxed text-fg">
                          <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {p.lessons && p.lessons.length > 0 && (
                  <>
                    <h4 className="mt-10 mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">What I'd do differently</h4>
                    <ul className="space-y-2">
                      {p.lessons.map((l) => (
                        <li key={l} className="flex gap-3 text-sm leading-relaxed text-muted">
                          <Lightbulb className="mt-0.5 size-4 shrink-0 text-warn" />
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                <h4 className="mt-10 mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {p.stack.map((s) => (
                    <Tag key={s} active>
                      {s}
                    </Tag>
                  ))}
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-3">
                  {p.links?.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-fg px-4 py-2.5 text-sm font-medium text-bg"
                    >
                      {l.label} <ArrowUpRight className="size-4" />
                    </a>
                  ))}
                  <button
                    onClick={() => {
                      onClose();
                      openChat(`Tell me about ${p.title}`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:border-accent/60"
                  >
                    <Sparkles className="size-4 text-accent" /> Ask my AI about this
                  </button>
                </div>
              </motion.div>
            </div>

            {/* prev / next */}
            <div className="grid grid-cols-2 border-t border-line">
              <button
                onClick={() => onNavigate(prev.id)}
                className="group flex items-center gap-3 px-5 py-5 text-left transition-colors hover:bg-card sm:px-8"
              >
                <ArrowLeft className="size-4 shrink-0 text-subtle transition-transform group-hover:-translate-x-0.5" />
                <span className="min-w-0">
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-subtle">Previous</span>
                  <span className="block truncate text-sm text-fg">{prev.title}</span>
                </span>
              </button>
              <button
                onClick={() => onNavigate(next.id)}
                className="group flex items-center justify-end gap-3 border-l border-line px-5 py-5 text-right transition-colors hover:bg-card sm:px-8"
              >
                <span className="min-w-0">
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-subtle">Next</span>
                  <span className="block truncate text-sm text-fg">{next.title}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Pipeline({ steps }: { steps: { label: string; detail: string }[] }) {
  const cols = steps.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-bg/50 p-4 sm:p-5">
      <div className="bg-grid absolute inset-0 opacity-60" aria-hidden="true" />
      <ol className={`relative grid gap-3 sm:grid-cols-2 ${cols}`}>
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          return (
            <motion.li
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 * i + 0.15 }}
              className={`relative rounded-xl border p-4 ${last ? "border-accent/40 bg-accent/[0.07]" : "border-line bg-card"}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`grid size-6 place-items-center rounded-full font-mono text-[10px] ${
                    last ? "bg-accent text-accent-ink" : "border border-accent/40 text-accent"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent" aria-hidden="true" />
                {!last && (
                  <svg className="size-4 text-accent/70" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M2 12h18M14 6l6 6-6 6" className="animate-flow" stroke="currentColor" strokeWidth="1.6" strokeDasharray="4 3" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <div className="mt-3 text-sm leading-snug font-medium text-fg">{s.label}</div>
              <div className="mt-1 text-xs leading-snug text-subtle">{s.detail}</div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
