import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Ban, Bot, Brain, Check, FileSearch, Mail, Play, ScanSearch, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { agentPresets, runAgent, TOOL_NODES, type NodeId, type Step } from "../../lib/agent";
import { RichText } from "../ui";
import { Chip, LabNote, PanelTitle, useMediaQuery } from "./shared";

type Box = { x: number; y: number; w: number; h: number; round?: boolean };

const H_LAYOUT: { vb: [number, number]; nodes: Record<NodeId, Box> } = {
  vb: [960, 300],
  nodes: {
    start: { x: 34, y: 150, w: 28, h: 28, round: true },
    guardrail: { x: 160, y: 150, w: 128, h: 46 },
    planner: { x: 330, y: 150, w: 120, h: 46 },
    search_portfolio: { x: 560, y: 48, w: 180, h: 40 },
    skill_lookup: { x: 560, y: 116, w: 180, h: 40 },
    fit_check: { x: 560, y: 184, w: 180, h: 40 },
    get_contact: { x: 560, y: 252, w: 180, h: 40 },
    synthesize: { x: 790, y: 150, w: 130, h: 46 },
    end: { x: 926, y: 150, w: 28, h: 28, round: true },
  },
};

const V_LAYOUT: { vb: [number, number]; nodes: Record<NodeId, Box> } = {
  vb: [360, 560],
  nodes: {
    start: { x: 180, y: 22, w: 26, h: 26, round: true },
    guardrail: { x: 180, y: 92, w: 150, h: 44 },
    planner: { x: 180, y: 172, w: 150, h: 44 },
    search_portfolio: { x: 92, y: 266, w: 160, h: 42 },
    skill_lookup: { x: 268, y: 266, w: 160, h: 42 },
    fit_check: { x: 92, y: 330, w: 160, h: 42 },
    get_contact: { x: 268, y: 330, w: 160, h: 42 },
    synthesize: { x: 180, y: 430, w: 150, h: 44 },
    end: { x: 180, y: 520, w: 26, h: 26, round: true },
  },
};

const LABEL: Record<NodeId, string> = {
  start: "",
  guardrail: "guardrail",
  planner: "planner",
  search_portfolio: "search_portfolio",
  skill_lookup: "skill_lookup",
  fit_check: "fit_check",
  get_contact: "get_contact",
  synthesize: "synthesize",
  end: "",
};

const ICON: Record<NodeId, ReactNode> = {
  start: <Play className="size-3.5" />,
  guardrail: <ShieldCheck className="size-3.5" />,
  planner: <Brain className="size-3.5" />,
  search_portfolio: <FileSearch className="size-3.5" />,
  skill_lookup: <Wrench className="size-3.5" />,
  fit_check: <ScanSearch className="size-3.5" />,
  get_contact: <Mail className="size-3.5" />,
  synthesize: <Sparkles className="size-3.5" />,
  end: <Check className="size-3.5" />,
};

const EDGES: [NodeId, NodeId][] = [
  ["start", "guardrail"],
  ["guardrail", "planner"],
  ...TOOL_NODES.map((t) => ["planner", t] as [NodeId, NodeId]),
  ...TOOL_NODES.map((t) => [t, "synthesize"] as [NodeId, NodeId]),
  ["synthesize", "end"],
  ["guardrail", "end"],
];

function edgePath(a: Box, b: Box, vertical: boolean, blockedEdge: boolean) {
  if (blockedEdge) {
    if (vertical) {
      const x0 = a.x - a.w / 2;
      const x1 = b.x - b.w / 2;
      return `M ${x0} ${a.y} C ${x0 - 40} ${a.y}, ${12} ${a.y + 40}, ${12} ${(a.y + b.y) / 2} S ${x1 - 40} ${b.y}, ${x1} ${b.y}`;
    }
    const y0 = a.y - a.h / 2;
    return `M ${a.x} ${y0} C ${a.x} ${-10}, ${b.x} ${-10}, ${b.x} ${b.y - b.h / 2}`;
  }
  if (vertical) {
    const y0 = a.y + a.h / 2;
    const y1 = b.y - b.h / 2;
    const my = (y0 + y1) / 2;
    return `M ${a.x} ${y0} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${y1}`;
  }
  const x0 = a.x + a.w / 2;
  const x1 = b.x - b.w / 2;
  const mx = (x0 + x1) / 2;
  return `M ${x0} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${x1} ${b.y}`;
}

export default function AgentLab() {
  const reduce = useReducedMotion();
  const vertical = !useMediaQuery("(min-width: 768px)");
  const layout = vertical ? V_LAYOUT : H_LAYOUT;
  const [task, setTask] = useState(agentPresets[0]);
  const [runId, setRunId] = useState({ q: agentPresets[0], n: 0 });
  const run = useMemo(() => runAgent(runId.q), [runId]);
  const [shown, setShown] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    if (reduce) {
      setShown(run.steps.length + 1);
      return;
    }
    setShown(0);
    timers.current = Array.from({ length: run.steps.length + 1 }, (_, i) => window.setTimeout(() => setShown(i + 1), 450 + i * 650));
    return () => timers.current.forEach(clearTimeout);
  }, [run, reduce]);

  const go = (q: string) => {
    if (!q.trim()) return;
    setTask(q);
    setRunId((r) => ({ q, n: r.n + 1 }));
  };

  const revealed = run.steps.slice(0, shown);
  const done = shown > run.steps.length;
  const active: NodeId | null = done ? "end" : (revealed[revealed.length - 1]?.node ?? (shown === 0 ? "start" : null));
  const visited = new Set<NodeId>(["start", ...revealed.map((s) => s.node), ...(done ? (["end"] as NodeId[]) : [])]);
  const calls = (n: NodeId) => revealed.filter((s) => s.node === n).length;

  // traversed edges
  const path: NodeId[] = ["start", ...revealed.map((s) => s.node), ...(done ? (["end"] as NodeId[]) : [])];
  const traversed = new Set<string>();
  for (let i = 1; i < path.length; i++) {
    let from = path[i - 1];
    const to = path[i];
    if (TOOL_NODES.includes(from) && TOOL_NODES.includes(to)) from = "planner"; // parallel fan-out from planner
    traversed.add(`${from}->${to}`);
    if (TOOL_NODES.includes(from) && to === "synthesize") for (const t of TOOL_NODES) if (visited.has(t)) traversed.add(`${t}->synthesize`);
  }

  return (
    <div className="p-5 md:p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(task);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-line bg-bg/60 px-4 py-3 text-sm text-fg focus:border-accent/60 focus:outline-none"
          placeholder="Give the agent a multi-part task…"
          aria-label="Task for the agent"
        />
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink">
          <Bot className="size-4" /> Run agent
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {agentPresets.map((p) => (
          <Chip key={p} active={runId.q === p} onClick={() => go(p)}>
            {p.length > 54 ? p.slice(0, 52) + "…" : p}
          </Chip>
        ))}
      </div>

      {/* graph */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-bg/50 p-3 sm:p-4">
        <div className="mb-1 flex items-center justify-between px-1 font-mono text-[10.5px] text-subtle">
          <span>graph · StateGraph(start → guardrail → planner → tools → synthesize → end)</span>
          <span className="hidden sm:inline">{done ? `${run.toolCalls} tool calls · ${run.ms.toFixed(1)}ms` : "running…"}</span>
        </div>
        <svg viewBox={`0 0 ${layout.vb[0]} ${layout.vb[1]}`} className="h-auto w-full" role="img" aria-label="Agent execution graph">
          {EDGES.map(([a, b]) => {
            const key = `${a}->${b}`;
            const blockedEdge = a === "guardrail" && b === "end";
            const on = traversed.has(key);
            return (
              <path
                key={key}
                d={edgePath(layout.nodes[a], layout.nodes[b], vertical, blockedEdge)}
                fill="none"
                stroke={on ? (blockedEdge ? "var(--status-critical)" : "var(--accent)") : "var(--line-strong)"}
                strokeWidth={on ? 2 : 1}
                strokeDasharray={blockedEdge && !on ? "4 4" : on ? "6 5" : undefined}
                strokeLinecap="round"
                className={on && !reduce ? "animate-flow" : undefined}
                opacity={on ? 1 : 0.7}
              />
            );
          })}
          {(Object.keys(layout.nodes) as NodeId[]).map((id) => {
            const b = layout.nodes[id];
            const isOn = visited.has(id);
            const isActive = active === id && !done;
            const blocked = id === "guardrail" && run.blocked && isOn;
            const n = calls(id);
            if (b.round)
              return (
                <g key={id}>
                  <circle cx={b.x} cy={b.y} r={b.w / 2} fill={isOn ? "var(--accent)" : "var(--bg-elev)"} stroke={isOn ? "var(--accent)" : "var(--line-strong)"} strokeWidth={1.5} />
                  <foreignObject x={b.x - 8} y={b.y - 8} width={16} height={16}>
                    <div className={`grid size-4 place-items-center ${isOn ? "text-accent-ink" : "text-subtle"}`}>{ICON[id]}</div>
                  </foreignObject>
                </g>
              );
            return (
              <g key={id}>
                {isActive && !reduce && (
                  <motion.rect
                    x={b.x - b.w / 2 - 4}
                    y={b.y - b.h / 2 - 4}
                    width={b.w + 8}
                    height={b.h + 8}
                    rx={14}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    initial={{ opacity: 0.9 }}
                    animate={{ opacity: [0.9, 0.2, 0.9] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  />
                )}
                <rect
                  x={b.x - b.w / 2}
                  y={b.y - b.h / 2}
                  width={b.w}
                  height={b.h}
                  rx={11}
                  fill={blocked ? "color-mix(in oklab, var(--status-critical) 18%, var(--bg-elev))" : isOn ? "color-mix(in oklab, var(--accent) 14%, var(--bg-elev))" : "var(--bg-elev)"}
                  stroke={blocked ? "var(--status-critical)" : isOn ? "color-mix(in oklab, var(--accent) 60%, transparent)" : "var(--line-strong)"}
                  strokeWidth={1.2}
                />
                <foreignObject x={b.x - b.w / 2} y={b.y - b.h / 2} width={b.w} height={b.h}>
                  <div className={`flex h-full items-center justify-center gap-1.5 px-2 font-mono text-[12px] ${isOn ? "text-fg" : "text-subtle"}`}>
                    <span className={blocked ? "text-status-critical" : isOn ? "text-accent" : ""}>{blocked ? <Ban className="size-3.5" /> : ICON[id]}</span>
                    <span className="truncate">{LABEL[id]}</span>
                    {n > 1 && <span className="rounded bg-accent px-1 text-[10px] text-accent-ink">×{n}</span>}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* trace */}
        <div>
          <PanelTitle meta={`${revealed.length}/${run.steps.length} steps`}>Execution trace</PanelTitle>
          <ol className="space-y-2">
            <AnimatePresence initial={false}>
              {revealed.map((s, i) => (
                <TraceStep key={`${runId.n}-${i}`} s={s} />
              ))}
            </AnimatePresence>
            {!done && <li className="h-12 animate-pulse rounded-xl border border-line/60 bg-card" />}
          </ol>
        </div>

        {/* answer */}
        <div>
          <PanelTitle>Final answer</PanelTitle>
          <div className={`ring-gradient relative min-h-[180px] rounded-2xl border border-line bg-card p-5 transition-opacity ${done ? "opacity-100" : "opacity-50"}`}>
            {done ? (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="prose-chat text-sm leading-relaxed whitespace-pre-line text-muted">
                <RichText text={run.answer} />
              </motion.div>
            ) : (
              <div className="space-y-2">
                <div className="h-3 w-4/5 animate-pulse rounded bg-line" />
                <div className="h-3 w-3/5 animate-pulse rounded bg-line" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-line" />
              </div>
            )}
            {done && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3 font-mono text-[10.5px] text-subtle">
                <span>tool calls: {run.toolCalls}</span>
                <span>·</span>
                <span>LLM calls: 0</span>
                <span>·</span>
                <span>{run.ms.toFixed(1)}ms total</span>
              </div>
            )}
          </div>
          <div className="mt-4">
            <LabNote>
              The planner here is rule-based so it runs offline, but the tools are real: BM25 retrieval, a skill index, the fit analyzer and the guardrail. In
              production this graph would be a LangGraph StateGraph with an LLM planner and the same guardrail in front.
            </LabNote>
          </div>
        </div>
      </div>
    </div>
  );
}

function TraceStep({ s }: { s: Step }) {
  const args = s.args ? Object.entries(s.args).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ") : "";
  const tone = s.status === "blocked" ? "text-status-critical" : s.status === "miss" ? "text-warn" : "text-ok";
  return (
    <motion.li initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-line bg-card p-3">
      <div className="flex items-center gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-md border border-line bg-bg/50 text-accent">{ICON[s.node]}</span>
        <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-fg">
          {s.label}({args})
        </code>
        <span className="shrink-0 font-mono text-[10px] text-subtle tabular-nums">{s.ms.toFixed(2)}ms</span>
      </div>
      {s.thought && (
        <p className="mt-2 text-xs text-muted">
          <span className="font-mono text-[10.5px] text-accent-2">thought </span>
          {s.thought}
        </p>
      )}
      <p className={`mt-1.5 font-mono text-[11px] ${tone}`}>→ {s.observation}</p>
    </motion.li>
  );
}
