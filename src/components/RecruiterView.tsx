import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, BadgeCheck, Check, ClipboardCopy, Download, Mail, ScanSearch, Timer, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { profile, projects, recruiter } from "../data/portfolio";
import { track } from "../lib/analytics";
import { useCopy, useLockBody } from "../hooks/hooks";
import { GithubIcon, icons, LinkedinIcon, useUI } from "./ui";

function summaryText() {
  const tops = recruiter.topProjects.map((id) => projects.find((p) => p.id === id)!).filter(Boolean);
  return [
    `${profile.name} — ${profile.role} (${profile.location})`,
    recruiter.headline,
    "",
    ...recruiter.facts.map((f) => `${f.label}: ${f.value}`),
    "",
    "Strengths:",
    ...recruiter.strengths.map((s) => `- ${s.title}: ${s.body}`),
    "",
    "Selected work:",
    ...tops.map((p) => `- ${p.title}: ${p.tagline}`),
    "",
    `Core stack: ${recruiter.coreStack.join(", ")}`,
    `Domains: ${recruiter.domains.map((d) => d.label).join(", ")}`,
    "",
    `Email: ${profile.email}`,
    `LinkedIn: ${profile.socials.linkedin}`,
    `GitHub: ${profile.socials.github}`,
    typeof window !== "undefined" ? `Portfolio: ${window.location.origin}${window.location.pathname}` : "",
  ].join("\n");
}

export default function RecruiterView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { copied, copy } = useCopy();
  const { openProject } = useUI();
  const closeRef = useRef<HTMLButtonElement>(null);
  useLockBody(open);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const goFit = () => {
    onClose();
    window.setTimeout(() => document.getElementById("fit")?.scrollIntoView({ behavior: "smooth" }), 120);
  };

  const tops = recruiter.topProjects.map((id) => projects.find((p) => p.id === id)!).filter(Boolean);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[85]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Recruiter quick view">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm light:bg-slate-900/30" onClick={onClose} />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute top-0 right-0 flex h-full w-full max-w-[520px] flex-col border-l border-line-strong bg-elev shadow-2xl"
          >
            {/* header */}
            <div className="relative overflow-hidden border-b border-line px-6 pt-6 pb-5">
              <div className="absolute inset-0 -z-0 bg-gradient-to-br from-accent/15 via-transparent to-accent-2/15" />
              <div className="relative flex items-start gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 font-display text-lg font-bold text-accent-ink">
                  {profile.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
                    <Timer className="size-3" /> 30-second view
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-fg">{profile.name}</h2>
                  <p className="text-sm text-muted">{recruiter.headline}</p>
                </div>
                <button
                  ref={closeRef}
                  onClick={onClose}
                  className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-muted hover:border-line-strong hover:text-fg"
                  aria-label="Close recruiter view"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
              {/* facts */}
              <dl className="grid grid-cols-2 gap-2">
                {recruiter.facts.map((f) => (
                  <div key={f.label} className="rounded-xl border border-line bg-card p-3">
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-subtle">{f.label}</dt>
                    <dd className="mt-1 text-sm leading-snug text-fg">{f.value}</dd>
                  </div>
                ))}
              </dl>

              {/* strengths */}
              <section>
                <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Why he stands out</h3>
                <ul className="space-y-3">
                  {recruiter.strengths.map((s) => (
                    <li key={s.title} className="flex gap-3">
                      <BadgeCheck className="mt-0.5 size-5 shrink-0 text-accent" />
                      <div>
                        <div className="font-medium text-fg">{s.title}</div>
                        <div className="text-sm leading-relaxed text-muted">{s.body}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* proof */}
              <section>
                <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Proof of work</h3>
                <div className="space-y-2">
                  {tops.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onClose();
                        openProject(p.id);
                      }}
                      className="group flex w-full items-center gap-3 rounded-xl border border-line bg-card p-3 text-left transition-colors hover:border-accent/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-fg">{p.title}</div>
                        <div className="truncate text-xs text-muted">{p.tagline}</div>
                      </div>
                      {p.metric && <span className="shrink-0 font-mono text-xs text-accent">{p.metric.value}</span>}
                      <ArrowUpRight className="size-4 shrink-0 text-subtle transition-transform group-hover:rotate-45 group-hover:text-accent" />
                    </button>
                  ))}
                </div>
              </section>

              {/* stack + domains */}
              <section>
                <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Core stack</h3>
                <div className="flex flex-wrap gap-1.5">
                  {recruiter.coreStack.map((s) => (
                    <span key={s} className="rounded-lg border border-line bg-bg/40 px-2.5 py-1 text-xs text-fg">
                      {s}
                    </span>
                  ))}
                </div>
                <h3 className="mt-5 mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Industries shipped for</h3>
                <div className="grid grid-cols-2 gap-2">
                  {recruiter.domains.map((d) => {
                    const Icon = icons[d.icon];
                    return (
                      <div key={d.label} className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-sm text-fg">
                        <Icon className="size-4 shrink-0 text-accent" /> {d.label}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* actions */}
            <div className="space-y-2 border-t border-line p-4">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`./${profile.resume}`}
              onClick={() => track("resume_download")}
                  download
                  className="flex items-center justify-center gap-2 rounded-xl bg-fg px-4 py-3 text-sm font-medium text-bg"
                >
                  <Download className="size-4" /> Resume (PDF)
                </a>
                <button
                  onClick={goFit}
                  className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-ink"
                >
                  <ScanSearch className="size-4" /> Check fit vs. JD
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => copy(summaryText())}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-xs text-fg hover:border-line-strong"
                >
                  {copied ? <Check className="size-4 text-ok" /> : <ClipboardCopy className="size-4" />}
                  {copied ? "Copied" : (
                    <>
                      Copy summary<span className="hidden sm:inline"> for ATS</span>
                    </>
                  )}
                </button>
                <a href={`mailto:${profile.email}`} className="grid place-items-center rounded-xl border border-line text-fg hover:border-line-strong" aria-label="Email">
                  <Mail className="size-4" />
                </a>
                <div className="grid grid-cols-2 gap-2">
                  <a href={profile.socials.linkedin} target="_blank" rel="noreferrer" className="grid place-items-center rounded-xl border border-line text-fg hover:border-line-strong" aria-label="LinkedIn">
                    <LinkedinIcon className="size-4" />
                  </a>
                  <a href={profile.socials.github} target="_blank" rel="noreferrer" className="grid place-items-center rounded-xl border border-line text-fg hover:border-line-strong" aria-label="GitHub">
                    <GithubIcon className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
