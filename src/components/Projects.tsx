import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ArrowUpRight, Brain, Cpu, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { projects, type Project, type ProjectCategory } from "../data/portfolio";
import { Reveal, Section, Tag, useSpotlight } from "./ui";

const filters: ("All" | ProjectCategory)[] = ["All", "GenAI & RAG", "AI Security", "ML & Recsys"];

export const categoryIcon: Record<ProjectCategory, typeof Brain> = {
  "GenAI & RAG": Brain,
  "AI Security": ShieldCheck,
  "ML & Recsys": Cpu,
};

export default function Projects({ onOpen }: { onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const list = useMemo(
    () => (filter === "All" ? projects : projects.filter((p) => p.category === filter)),
    [filter],
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        filters.map((f) => [f, f === "All" ? projects.length : projects.filter((p) => p.category === f).length]),
      ) as Record<(typeof filters)[number], number>,
    [],
  );

  return (
    <Section
      id="projects"
      index="03"
      eyebrow="Selected work"
      title={
        <>
          Systems I've <span className="text-gradient">designed & built</span>.
        </>
      }
      subtitle="Production GenAI, LLM security and ML. Open any card to see the architecture, the problem it solves and the stack."
    >
      <Reveal>
        <LayoutGroup>
          <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter projects">
            {filters.map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`relative isolate rounded-full px-4 py-2 text-sm transition-colors ${
                  filter === f ? "text-accent-ink" : "text-muted hover:text-fg"
                }`}
              >
                {filter === f && (
                  <motion.span
                    layoutId="filter-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {filter !== f && <span className="absolute inset-0 -z-10 rounded-full border border-line bg-card" />}
                {f}
                <span className={`ml-1.5 font-mono text-[11px] ${filter === f ? "opacity-70" : "text-subtle"}`}>{counts[f]}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </Reveal>

      <motion.div layout className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => {
            const wide = isWide(i, list.length);
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.2) }}
                className={`${wide.md ? "md:col-span-2" : ""} ${wide.lg ? "lg:col-span-2" : "lg:col-span-1"}`}
              >
                <ProjectCard p={p} onOpen={() => onOpen(p.id)} highlight={i === 0} wide={wide.lg} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </Section>
  );
}

/** Pick which cards span two columns so every row is full (2-col md, 3-col lg grid). */
function isWide(i: number, n: number) {
  const last = i === n - 1;
  const lg = (n % 3 === 1 && (i === 0 || last)) || (n % 3 === 2 && i === 0);
  const md = n % 2 === 1 && i === 0;
  return { md, lg };
}

function ProjectCard({ p, onOpen, highlight, wide }: { p: Project; onOpen: () => void; highlight?: boolean; wide?: boolean }) {
  const steps = wide ? p.pipeline.length : 4;
  const spot = useSpotlight();
  const Icon = categoryIcon[p.category];
  return (
    <button
      onClick={onOpen}
      onMouseMove={spot}
      className={`spotlight group flex h-full w-full flex-col rounded-2xl border border-line bg-card p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-2xl hover:shadow-black/30 light:hover:shadow-slate-300/50 ${
        highlight ? "ring-gradient" : ""
      }`}
      aria-label={`Open case study: ${p.title}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-bg/40 px-2.5 py-1 font-mono text-[11px] text-muted">
          <Icon className="size-3.5 text-accent" />
          {p.category}
        </span>
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-subtle transition-all group-hover:rotate-45 group-hover:border-accent/50 group-hover:text-accent">
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      <h3 className="font-display text-xl font-semibold leading-snug tracking-tight text-fg">{p.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{p.tagline}</p>
      {wide && <p className="mt-3 hidden max-w-2xl text-sm leading-relaxed text-subtle lg:block">{p.problem}</p>}

      {/* mini pipeline */}
      <div className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-2 font-mono text-[10.5px] text-subtle">
        {p.pipeline.slice(0, steps).map((s, i) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="rounded-md border border-line bg-bg/40 px-1.5 py-0.5 text-muted">{s.label}</span>
            {i < Math.min(p.pipeline.length, steps) - 1 && <span className="text-accent/70">→</span>}
          </span>
        ))}
        {p.pipeline.length > steps && <span className="text-subtle">+{p.pipeline.length - steps}</span>}
      </div>

      <div className="mt-auto pt-6">
        <div className="flex flex-wrap gap-1.5">
          {p.stack.slice(0, wide ? 7 : 4).map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
          {p.stack.length > (wide ? 7 : 4) && <Tag>+{p.stack.length - (wide ? 7 : 4)}</Tag>}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs">
          <span className="truncate text-subtle">{p.type}</span>
          {p.metric && (
            <span className="ml-3 shrink-0 font-mono">
              <span className="text-accent">{p.metric.value}</span>
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
