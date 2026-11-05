import { GraduationCap } from "lucide-react";
import { achievements, education } from "../data/portfolio";
import { icons, Reveal, Section } from "./ui";

export default function Education() {
  return (
    <Section id="education" index="06" eyebrow="Education & recognition" title="Foundations.">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <Reveal>
          <div className="ring-gradient relative h-full overflow-hidden rounded-2xl border border-line bg-card p-7">
            <div className="absolute -top-16 -right-16 size-48 rounded-full bg-accent/10 blur-3xl" />
            <span className="grid size-12 place-items-center rounded-xl border border-line bg-gradient-to-br from-accent/20 to-accent-2/15 text-accent">
              <GraduationCap className="size-6" />
            </span>
            <p className="mt-6 font-mono text-xs text-subtle">{education.period}</p>
            <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-fg md:text-2xl">{education.degree}</h3>
            <p className="mt-2 text-muted">
              {education.school}, {education.location}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent">
              {education.grade}
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted">
              Final-year project: a real-time CNC machine failure predictor on live sensor data. XGBoost, 95% accuracy.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-3">
          {achievements.map((a, i) => {
            const Icon = icons[a.icon];
            return (
              <Reveal key={a.title} delay={i * 0.05}>
                <div className="group flex items-center gap-4 rounded-2xl border border-line bg-card p-4 transition-colors hover:border-line-strong md:p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-bg/40 text-accent transition-transform group-hover:scale-105">
                    <Icon className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-fg">{a.title}</div>
                    <div className="text-sm text-muted">{a.detail}</div>
                  </div>
                  {a.year && <span className="shrink-0 font-mono text-xs text-subtle">{a.year}</span>}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
