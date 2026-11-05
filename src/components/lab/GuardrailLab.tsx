import { AnimatePresence, motion } from "motion/react";
import { Ban, CircleCheck, Eraser, ShieldAlert, ShieldCheck } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { attackPresets, scan, type ScanResult } from "../../lib/guardrail";

/* ───────────────────────── Guardrail playground ───────────────────────── */

const verdictStyle: Record<ScanResult["verdict"], { label: string; cls: string; icon: React.ReactNode; line: string }> = {
  ALLOW: { label: "Allowed", cls: "border-ok/40 bg-ok/10 text-ok", icon: <ShieldCheck className="size-6" />, line: "Request passes to the model." },
  REDACT: { label: "Redacted", cls: "border-warn/40 bg-warn/10 text-warn", icon: <ShieldAlert className="size-6" />, line: "Sensitive data masked before it reaches the model." },
  BLOCK: { label: "Blocked", cls: "border-danger/40 bg-danger/10 text-danger", icon: <Ban className="size-6" />, line: "Attack stopped. Nothing reaches the model." },
};

const sevDot = { low: "bg-accent-3", medium: "bg-warn", high: "bg-danger" } as const;

export default function GuardrailLab() {
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

