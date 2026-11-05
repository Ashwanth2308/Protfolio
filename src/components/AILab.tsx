import { AnimatePresence, motion } from "motion/react";
import { Activity, Bot, FlaskConical, HeartHandshake, Scissors, SearchCheck, ShieldHalf, SlidersHorizontal, Target, Workflow, type LucideIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useState, type ComponentType, type LazyExoticComponent } from "react";
import { Reveal, Section } from "./ui";
import { track } from "../lib/analytics";

type Demo = {
  id: string;
  title: string;
  sub: string;
  tag: string;
  icon: LucideIcon;
  path: string;
  View: LazyExoticComponent<ComponentType>;
};

export const demos: Demo[] = [
  { id: "agent", title: "Agent workbench", sub: "Watch a tool-using agent plan, call tools and answer", tag: "Agents", icon: Bot, path: "~/lab/agent — graph run", View: lazy(() => import("./lab/AgentLab")) },
  { id: "guard", title: "Guardrail playground", sub: "Try to jailbreak an LLM gateway", tag: "Security", icon: ShieldHalf, path: "~/lab/llm-gateway — playground", View: lazy(() => import("./lab/GuardrailLab")) },
  { id: "ground", title: "Hallucination checker", sub: "Catch claims the source doesn't support", tag: "RAG evals", icon: SearchCheck, path: "~/lab/eval — grounding check", View: lazy(() => import("./lab/GroundingLab")) },
  { id: "rag", title: "RAG under the hood", sub: "Watch retrieval run step by step", tag: "RAG", icon: Workflow, path: "~/lab/rag — pipeline inspector", View: lazy(() => import("./lab/RagLab")) },
  { id: "chunk", title: "Chunking lab", sub: "See how chunk size changes what gets retrieved", tag: "RAG", icon: Scissors, path: "~/lab/ingest — chunker", View: lazy(() => import("./lab/ChunkLab")) },
  { id: "decode", title: "Decoding lab", sub: "Temperature, top-k and top-p, live", tag: "LLMs", icon: SlidersHorizontal, path: "~/lab/llm — sampler", View: lazy(() => import("./lab/DecodeLab")) },
  { id: "evals", title: "Evals lab", sub: "Tune a threshold: precision vs recall vs false positives", tag: "Evals", icon: Target, path: "~/lab/eval — threshold tuning", View: lazy(() => import("./lab/EvalLab")) },
  { id: "recsys", title: "Matchmaking engine", sub: "Two-stage retrieval that learns from likes", tag: "RecSys", icon: HeartHandshake, path: "~/lab/recsys — two-stage ranker", View: lazy(() => import("./lab/RecsysLab")) },
  { id: "stream", title: "Live failure prediction", sub: "Stream sensors, inject faults, catch failures", tag: "ML", icon: Activity, path: "~/lab/predictive-maintenance — live", View: lazy(() => import("./lab/StreamLab")) },
];

export default function AILab() {
  const [tab, setTab] = useState(demos[0].id);
  const demo = demos.find((d) => d.id === tab) ?? demos[0];

  // Deep links: #lab/<demo-id> opens a specific playground (used by the command palette, and shareable)
  useEffect(() => {
    const read = () => {
      const m = window.location.hash.match(/^#lab\/([\w-]+)/);
      if (m && demos.some((d) => d.id === m[1])) {
        setTab(m[1]);
        window.setTimeout(() => document.getElementById("lab")?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const select = (id: string) => {
    setTab(id);
    track("lab_open", { demo: id });
    try {
      history.replaceState(null, "", `#lab/${id}`);
    } catch {
      /* ignore */
    }
  };

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
      subtitle="Nine live playgrounds running in your browser: agents, LLM security, RAG, hallucination checks, evals, decoding, recommendation and predictive maintenance. No API keys, and nothing you type leaves the page."
    >
      <Reveal>
        <div
          className="-mx-5 mb-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0"
          role="tablist"
          aria-label="AI Lab playgrounds"
        >
          {demos.map((d) => {
            const active = d.id === tab;
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                role="tab"
                aria-selected={active}
                onClick={() => select(d.id)}
                className={`group relative flex min-w-[210px] snap-start items-center gap-3 rounded-2xl border p-3 text-left transition-all md:min-w-0 ${
                  active ? "border-accent/60 bg-accent/[0.08] shadow-lg shadow-accent/10" : "border-line bg-card hover:-translate-y-0.5 hover:border-line-strong"
                }`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl border transition-colors ${
                    active ? "border-accent/50 bg-accent text-accent-ink" : "border-line bg-bg/40 text-accent group-hover:border-accent/40"
                  }`}
                >
                  <Icon className="size-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-sm leading-tight font-semibold text-fg">{d.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-subtle">{d.sub}</span>
                </span>
                <span className="absolute top-2 right-2.5 font-mono text-[9.5px] uppercase tracking-widest text-subtle">{d.tag}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="ring-gradient relative overflow-hidden rounded-3xl border border-line bg-elev/70 shadow-2xl shadow-black/30 light:shadow-slate-200">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="size-2.5 shrink-0 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 shrink-0 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 shrink-0 rounded-full bg-[#28c840]" />
            <span className="ml-3 truncate font-mono text-[11px] text-subtle">{demo.path}</span>
            <span className="ml-3 hidden truncate text-xs text-muted lg:inline">· {demo.sub}</span>
            <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-subtle">
              <FlaskConical className="size-3 text-accent" /> runs locally
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={demo.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
              <Suspense fallback={<LabSkeleton />}>
                <demo.View />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </Reveal>
    </Section>
  );
}

function LabSkeleton() {
  return (
    <div className="space-y-4 p-6" aria-label="Loading playground">
      <div className="h-11 animate-pulse rounded-xl bg-line/60" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-line/40" />
        <div className="h-64 animate-pulse rounded-2xl bg-line/40" />
      </div>
    </div>
  );
}
