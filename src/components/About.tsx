import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { focusAreas, profile, stats } from "../data/portfolio";
import { icons, Reveal, Section, useSpotlight } from "./ui";

function Counter({ value, decimals, suffix }: { value: number; decimals: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, { duration: 1.6, ease: [0.22, 1, 0.36, 1], onUpdate: setDisplay });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

const code = [
  { k: "kw", t: "class " },
  { k: "cls", t: "Ashwanth" },
  { k: "p", t: "(" },
  { k: "cls", t: "AIEngineer" },
  { k: "p", t: "):\n" },
  { k: "p", t: "    location " },
  { k: "op", t: "= " },
  { k: "str", t: '"Hyderabad, India"\n' },
  { k: "p", t: "    focus    " },
  { k: "op", t: "= " },
  { k: "p", t: "[" },
  { k: "str", t: '"RAG"' },
  { k: "p", t: ", " },
  { k: "str", t: '"Agents"' },
  { k: "p", t: ", " },
  { k: "str", t: '"LLM Security"' },
  { k: "p", t: "]\n" },
  { k: "p", t: "    stack    " },
  { k: "op", t: "= " },
  { k: "p", t: "[" },
  { k: "str", t: '"Python"' },
  { k: "p", t: ", " },
  { k: "str", t: '"LangGraph"' },
  { k: "p", t: ", " },
  { k: "str", t: '"FastAPI"' },
  { k: "p", t: "]\n\n" },
  { k: "p", t: "    " },
  { k: "kw", t: "def " },
  { k: "fn", t: "build" },
  { k: "p", t: "(self, problem):\n" },
  { k: "p", t: "        context " },
  { k: "op", t: "= " },
  { k: "p", t: "self." },
  { k: "fn", t: "retrieve" },
  { k: "p", t: "(problem, cite" },
  { k: "op", t: "=" },
  { k: "kw", t: "True" },
  { k: "p", t: ")\n" },
  { k: "p", t: "        answer  " },
  { k: "op", t: "= " },
  { k: "p", t: "self." },
  { k: "fn", t: "reason" },
  { k: "p", t: "(context, guardrails" },
  { k: "op", t: "=" },
  { k: "kw", t: "True" },
  { k: "p", t: ")\n" },
  { k: "p", t: "        " },
  { k: "kw", t: "return " },
  { k: "p", t: "self." },
  { k: "fn", t: "ship" },
  { k: "p", t: "(answer, evaluated" },
  { k: "op", t: "=" },
  { k: "kw", t: "True" },
  { k: "p", t: ")" },
];

const tone: Record<string, string> = {
  kw: "text-accent-2",
  cls: "text-accent-3",
  fn: "text-accent",
  str: "text-[#fca5a5] light:text-[#b45309]",
  op: "text-subtle",
  p: "text-fg/85",
};

export default function About() {
  const spot = useSpotlight();
  return (
    <>
      {/* stats band */}
      <div className="relative mx-auto -mt-4 w-full max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-card backdrop-blur md:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`p-6 md:p-8 ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line md:border-t-0" : ""} ${
                  i === 2 ? "md:border-l" : ""
                }`}
              >
                <div className="font-display text-3xl font-semibold tracking-tight text-fg md:text-4xl">
                  <Counter value={s.value} decimals={s.decimals} suffix={s.suffix} />
                </div>
                <div className="mt-2 text-xs leading-snug text-muted md:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <Section
        id="about"
        index="01"
        eyebrow="About"
        title={
          <>
            Shipping AI that is <span className="text-gradient">grounded, secure</span> and measurable.
          </>
        }
      >
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <Reveal className="space-y-5 text-base leading-relaxed text-muted md:text-lg">
            {profile.summary.map((p, i) => (
              <p key={i} className={i === 0 ? "text-fg/90" : ""}>
                {p}
              </p>
            ))}
          </Reveal>

          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-2xl border border-line bg-elev/70 shadow-xl shadow-black/20 light:shadow-slate-200">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-line-strong" />
                <span className="size-2.5 rounded-full bg-line-strong" />
                <span className="size-2.5 rounded-full bg-line-strong" />
                <span className="ml-2 font-mono text-[11px] text-subtle">ashwanth.py</span>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-6 sm:p-5 sm:text-[13px]">
                <code>
                  {code.map((c, i) => (
                    <span key={i} className={tone[c.k]}>
                      {c.t}
                    </span>
                  ))}
                </code>
              </pre>
            </div>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {focusAreas.map((f, i) => {
            const Icon = icons[f.icon];
            return (
              <Reveal key={f.title} delay={i * 0.06}>
                <div
                  onMouseMove={spot}
                  className="spotlight group h-full rounded-2xl border border-line bg-card p-6 transition-colors hover:border-line-strong"
                >
                  <div className="mb-5 grid size-11 place-items-center rounded-xl border border-line bg-gradient-to-br from-accent/15 to-accent-2/10 text-accent transition-transform group-hover:-translate-y-0.5">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-fg">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>
    </>
  );
}
