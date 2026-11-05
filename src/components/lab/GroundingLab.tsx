import { motion } from "motion/react";
import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { checkGrounding, groundingPresets, type Verdict } from "../../lib/grounding";
import { Chip, LabNote, PanelTitle } from "./shared";

const V: Record<Verdict, { label: string; color: string; icon: typeof CircleCheck }> = {
  supported: { label: "Supported", color: "var(--status-good)", icon: CircleCheck },
  partial: { label: "Partly supported", color: "var(--status-warning)", icon: CircleAlert },
  unsupported: { label: "Not supported", color: "var(--status-critical)", icon: CircleX },
};

export default function GroundingLab() {
  const [preset, setPreset] = useState(0);
  const [source, setSource] = useState(groundingPresets[0].source);
  const [answer, setAnswer] = useState(groundingPresets[0].answer);
  const [focus, setFocus] = useState<number | null>(null);
  const dSource = useDeferredValue(source);
  const dAnswer = useDeferredValue(answer);
  const r = useMemo(() => checkGrounding(dSource, dAnswer), [dSource, dAnswer]);

  const pick = (i: number) => {
    setPreset(i);
    setSource(groundingPresets[i].source);
    setAnswer(groundingPresets[i].answer);
    setFocus(null);
  };

  const counts = { supported: 0, partial: 0, unsupported: 0 };
  for (const s of r.sentences) counts[s.verdict]++;
  const scoreColor = r.score >= 80 ? "var(--status-good)" : r.score >= 50 ? "var(--status-warning)" : "var(--status-critical)";
  const cited = new Set(focus !== null ? (r.sentences[focus]?.sources ?? []) : r.sentences.flatMap((s) => s.sources));

  return (
    <div className="p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Scenario</span>
        {groundingPresets.map((p, i) => (
          <Chip key={p.label} active={preset === i} onClick={() => pick(i)}>
            {p.label}
          </Chip>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {/* source */}
        <div>
          <PanelTitle n={1} meta="retrieved context">
            Source
          </PanelTitle>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            rows={5}
            className="w-full resize-y rounded-xl border border-line bg-bg/60 p-3 text-[13px] leading-relaxed text-fg focus:border-accent/60 focus:outline-none"
            aria-label="Source text"
          />
          <ol className="mt-3 space-y-1.5">
            {r.sourceSentences.map((s, i) => (
              <li
                key={i}
                className={`flex gap-2 rounded-lg border px-2.5 py-1.5 text-xs leading-relaxed transition-colors ${
                  cited.has(i) ? "border-accent/50 bg-accent/[0.07] text-fg" : "border-transparent text-muted"
                }`}
              >
                <span className="shrink-0 font-mono text-[10.5px] text-subtle">S{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* answer + verdicts */}
        <div>
          <PanelTitle n={2} meta="edit it to add a hallucination">
            Model answer
          </PanelTitle>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-xl border border-line bg-bg/60 p-3 text-[13px] leading-relaxed text-fg focus:border-accent/60 focus:outline-none"
            aria-label="Model answer"
          />

          <div className="mt-4 rounded-2xl border border-line bg-card p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-subtle">Faithfulness</div>
                <div className="font-display text-4xl font-semibold text-fg">{r.score}%</div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted">
                {(Object.keys(V) as Verdict[]).map((k) => {
                  const I = V[k].icon;
                  return (
                    <span key={k} className="inline-flex items-center gap-1.5">
                      <I className="size-3.5" style={{ color: V[k].color }} /> {counts[k]} {V[k].label.toLowerCase()}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: `color-mix(in oklab, ${scoreColor} 18%, transparent)` }}>
              <motion.div className="h-full rounded-full" style={{ background: scoreColor }} animate={{ width: `${r.score}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>

          <div className="mt-5">
            <PanelTitle n={3} meta={`${r.sentences.length} claims · ${r.ms.toFixed(1)}ms`}>
              Claim by claim
            </PanelTitle>
          </div>
          <ol className="space-y-2">
            {r.sentences.map((s, i) => {
              const v = V[s.verdict];
              const Icon = v.icon;
              return (
                <li
                  key={i}
                  tabIndex={0}
                  onMouseEnter={() => setFocus(i)}
                  onMouseLeave={() => setFocus(null)}
                  onFocus={() => setFocus(i)}
                  onBlur={() => setFocus(null)}
                  className={`rounded-xl border bg-card p-3 outline-none transition-colors ${focus === i ? "border-line-strong" : "border-line"}`}
                  style={{ borderLeft: `3px solid ${v.color}` }}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="mt-0.5 size-4 shrink-0" style={{ color: v.color }} />
                    <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-fg">{s.text}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 font-mono text-[10.5px] text-subtle">
                    <span className="text-muted">{v.label}</span>
                    <span>coverage {Math.round(s.coverage * 100)}%</span>
                    {s.sources.length > 0 && <span>evidence {s.sources.map((x) => `S${x + 1}`).join(" + ")}</span>}
                  </div>
                  {(s.missingNumbers.length > 0 || s.missingNames.length > 0 || (s.verdict !== "supported" && s.missingWords.length > 0)) && (
                    <ul className="mt-2 space-y-0.5 pl-6 text-xs text-muted">
                      {s.missingNumbers.map((n) => (
                        <li key={n}>• number “{n}” does not appear in the source</li>
                      ))}
                      {s.missingNames.map((n) => (
                        <li key={n}>• “{n}” is never mentioned in the source</li>
                      ))}
                      {s.verdict !== "supported" && !s.missingNumbers.length && !s.missingNames.length && s.missingWords.length > 0 && (
                        <li>• unsupported wording: {s.missingWords.join(", ")}</li>
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="mt-5">
        <LabNote>
          A lexical grounding check: each claim must be covered by one or two source sentences, and every number and name must appear in the source.
          Production checks add an NLI model or an LLM judge, but the rule is the one I apply to compliance RAG: no claim ships without evidence.
        </LabNote>
      </div>
    </div>
  );
}
