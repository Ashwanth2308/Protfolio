import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

type Line =
  | { t: "cmd"; text: string }
  | { t: "step"; tag: string; text: string; status?: "ok" | "bad" | "info" }
  | { t: "done"; text: string; status?: "ok" | "bad" };

type Scenario = { id: string; label: string; lines: Line[] };

// Illustrative traces of the kinds of systems Ashwanth builds.
const scenarios: Scenario[] = [
  {
    id: "rag",
    label: "compliance_rag.py",
    lines: [
      { t: "cmd", text: 'agent.run("Draft the CA Prop 103 rate filing")' },
      { t: "step", tag: "parse", text: "actuarial exhibits → LDF, DCCE, MPEP" },
      { t: "step", tag: "retrieve", text: "mongodb.search(query, k=8)" },
      { t: "step", tag: "rank", text: "regulatory authority hierarchy", status: "info" },
      { t: "step", tag: "guard", text: "compliance rules", status: "ok" },
      { t: "step", tag: "generate", text: "gemini · structured output" },
      { t: "done", text: "Draft ready — every field cites its governing regulation" },
    ],
  },
  {
    id: "gateway",
    label: "llm_gateway.py",
    lines: [
      { t: "cmd", text: "POST /v1/chat/completions" },
      { t: "step", tag: "input", text: '"Ignore all previous instructions and…"' },
      { t: "step", tag: "scan", text: "prompt_injection", status: "bad" },
      { t: "step", tag: "scan", text: "pii_leakage", status: "ok" },
      { t: "step", tag: "policy", text: "block · OWASP LLM01", status: "info" },
      { t: "done", text: "Attack blocked before it reached the agent", status: "bad" },
    ],
  },
  {
    id: "redteam",
    label: "red_team_graph.py",
    lines: [
      { t: "cmd", text: "redteam --target agent --suite owasp-llm-top10" },
      { t: "step", tag: "plan", text: "LangGraph attacker graph" },
      { t: "step", tag: "attack", text: "indirect injection via retrieved doc" },
      { t: "step", tag: "attack", text: "jailbreak · role-play variant" },
      { t: "step", tag: "measure", text: "attack success · FPR · latency", status: "info" },
      { t: "done", text: "Benchmark report: with vs. without gateway" },
    ],
  },
  {
    id: "finetune",
    label: "sigma_eval.py",
    lines: [
      { t: "cmd", text: "eval --model qlora-7b --task sigma-rules" },
      { t: "step", tag: "generate", text: "Sigma rule from attack description" },
      { t: "step", tag: "execute", text: "held-out attack + benign logs" },
      { t: "step", tag: "score", text: "detection rate · false positives", status: "ok" },
      { t: "step", tag: "compare", text: "vs frontier API: accuracy · cost · latency", status: "info" },
      { t: "done", text: "Serving with vLLM behind FastAPI" },
    ],
  },
];

const STEP_MS = 620;
const HOLD_MS = 2600;

export default function AgentTrace() {
  const reduce = useReducedMotion();
  const [s, setS] = useState(0);
  const [shown, setShown] = useState(reduce ? scenarios[0].lines.length : 0);
  const [paused, setPaused] = useState(false);
  const scenario = scenarios[s];

  useEffect(() => {
    if (reduce || paused) return;
    if (shown < scenario.lines.length) {
      const id = window.setTimeout(() => setShown((n) => n + 1), shown === 0 ? 350 : STEP_MS);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      setS((i) => (i + 1) % scenarios.length);
      setShown(0);
    }, HOLD_MS);
    return () => window.clearTimeout(id);
  }, [shown, scenario.lines.length, reduce, paused]);

  const pick = (i: number) => {
    setS(i);
    setShown(reduce ? scenarios[i].lines.length : 0);
  };

  return (
    <div
      className="ring-gradient relative overflow-hidden rounded-2xl border border-line bg-elev/80 shadow-2xl shadow-black/40 backdrop-blur-xl light:shadow-slate-300/60"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 truncate font-mono text-[11px] text-subtle">~/ashwanth/agents/{scenario.label}</span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-subtle">
          <span className={`size-1.5 rounded-full ${paused ? "bg-warn" : "bg-ok"} ${paused ? "" : "animate-pulse"}`} />
          {paused ? "paused" : "trace"}
        </span>
      </div>

      {/* tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-line px-2 py-1.5" role="tablist" aria-label="Example agent traces">
        {scenarios.map((sc, i) => (
          <button
            key={sc.id}
            role="tab"
            aria-selected={i === s}
            onClick={() => pick(i)}
            className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors ${
              i === s ? "bg-accent/12 text-accent" : "text-subtle hover:text-muted"
            }`}
          >
            {sc.id}
          </button>
        ))}
      </div>

      {/* body */}
      <div className="min-h-[268px] px-4 py-4 font-mono text-[12.5px] leading-6 sm:px-5 sm:text-[13px]">
        <AnimatePresence mode="popLayout">
          {scenario.lines.slice(0, shown).map((line, i) => (
            <motion.div
              key={`${scenario.id}-${i}`}
              initial={reduce ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex min-w-0 gap-2"
            >
              <TraceLine line={line} />
            </motion.div>
          ))}
        </AnimatePresence>
        {shown < scenario.lines.length && (
          <span className="mt-0.5 inline-block h-4 w-2 translate-y-0.5 animate-blink bg-accent" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

function TraceLine({ line }: { line: Line }) {
  if (line.t === "cmd")
    return (
      <>
        <span className="text-accent-2">❯</span>
        <span className="min-w-0 truncate text-fg">{line.text}</span>
      </>
    );
  if (line.t === "done")
    return (
      <span className={`mt-1 min-w-0 ${line.status === "bad" ? "text-danger" : "text-ok"}`}>
        {line.status === "bad" ? "✕" : "✓"} <span className="text-fg/90">{line.text}</span>
      </span>
    );
  const badge =
    line.status === "ok" ? (
      <span className="text-ok">✓</span>
    ) : line.status === "bad" ? (
      <span className="text-danger">✕ detected</span>
    ) : line.status === "info" ? (
      <span className="text-accent-3">●</span>
    ) : (
      <span className="text-subtle">…</span>
    );
  return (
    <>
      <span className="text-subtle">→</span>
      <span className="w-[4.6rem] shrink-0 text-accent">{line.tag}</span>
      <span className="min-w-0 flex-1 truncate text-muted">{line.text}</span>
      <span className="shrink-0">{badge}</span>
    </>
  );
}
