import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Briefcase, ChevronDown } from "lucide-react";
import { useState } from "react";
import { experience } from "../data/portfolio";
import { Reveal, Section } from "./ui";

export default function Experience({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  return (
    <Section
      id="experience"
      index="02"
      eyebrow="Experience"
      title="Where I've been building."
      subtitle="From trainee to Associate AI Engineer at Cygne Noir Cyber: GenAI for regulated insurance, consumer products and cybersecurity."
    >
      <div className="relative">
        {/* timeline rail */}
        <div className="absolute top-2 bottom-2 left-[15px] w-px bg-gradient-to-b from-accent via-accent-2/60 to-transparent md:left-[19px]" />

        <ol className="space-y-12">
          {experience.map((e, idx) => (
            <li key={e.role} className="relative pl-12 md:pl-16">
              <span className="absolute top-1 left-0 grid size-8 place-items-center rounded-full border border-line-strong bg-bg md:size-10">
                {e.current && <span className="absolute inset-0 animate-ping rounded-full bg-accent/20" />}
                <Briefcase className="relative size-3.5 text-accent md:size-4" />
              </span>

              <Reveal>
                <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-fg md:text-2xl">{e.role}</h3>
                    <p className="mt-1 text-sm text-muted">
                      <span className="text-accent">{e.company}</span> · {e.location}
                    </p>
                  </div>
                  <span className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-line bg-card px-3 py-1 font-mono text-xs text-muted md:mt-0">
                    {e.current && <span className="size-1.5 rounded-full bg-ok" />}
                    {e.period}
                  </span>
                </div>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted md:text-base">{e.summary}</p>
              </Reveal>

              <div className="mt-6 grid gap-3">
                {e.projects.map((p, i) => (
                  <Reveal key={p.name} delay={i * 0.04}>
                    <ProjectRow
                      name={p.name}
                      context={p.context}
                      points={p.points}
                      defaultOpen={idx === 0 && i === 0}
                      onOpen={p.projectId ? () => onOpenProject(p.projectId!) : undefined}
                    />
                  </Reveal>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

function ProjectRow({
  name,
  context,
  points,
  defaultOpen,
  onOpen,
}: {
  name: string;
  context?: string;
  points: string[];
  defaultOpen?: boolean;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div
      className={`rounded-xl border bg-card transition-colors ${open ? "border-line-strong" : "border-line hover:border-line-strong"}`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left md:px-5"
        aria-expanded={open}
      >
        <span className={`size-1.5 shrink-0 rounded-full ${open ? "bg-accent" : "bg-subtle"}`} />
        <span className="min-w-0 flex-1">
          <span className="font-medium text-fg">{name}</span>
          {context && <span className="ml-2 text-xs text-subtle">· {context}</span>}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-subtle transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 md:px-5 md:pl-[2.1rem]">
              <ul className="space-y-2">
                {points.map((pt, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted">
                    <span className="mt-2 h-px w-3 shrink-0 bg-accent/60" />
                    {pt}
                  </li>
                ))}
              </ul>
              {onOpen && (
                <button
                  onClick={onOpen}
                  className="mt-4 inline-flex items-center gap-1 font-mono text-xs text-accent transition-opacity hover:opacity-80"
                >
                  Open case study <ArrowUpRight className="size-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
