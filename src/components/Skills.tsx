import { logos, textOnly } from "../data/logos";
import { skills } from "../data/portfolio";
import { LogoChip } from "./Logo";
import { icons, Reveal, Section, useSpotlight } from "./ui";


export default function Skills() {
  const spot = useSpotlight();
  return (
    <Section
      id="skills"
      index="05"
      eyebrow="Toolkit"
      title={
        <>
          The stack behind the <span className="text-gradient">systems</span>.
        </>
      }
      subtitle="LLMs and agents, retrieval, ML foundations and the backend to put them into production."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {skills.map((g, i) => {
          const Icon = icons[g.icon];
          return (
            <Reveal key={g.group} delay={i * 0.05} className={i === 0 ? "md:col-span-2" : i === skills.length - 1 ? "md:col-span-2 lg:col-span-3" : ""}>
              <div
                onMouseMove={spot}
                className="spotlight h-full rounded-2xl border border-line bg-card p-6 transition-colors hover:border-line-strong"
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl border border-line bg-gradient-to-br from-accent/15 to-accent-2/10 text-accent">
                    <Icon className="size-[18px]" />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-fg">{g.group}</h3>
                  <span className="ml-auto font-mono text-xs text-subtle">{String(g.items.length).padStart(2, "0")}</span>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {g.items.map((s) => (
                    <li
                      key={s}
                      className="rounded-lg border border-line bg-bg/40 px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:border-accent/50 hover:text-fg"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          );
        })}
      </div>

      <div className="relative mt-14 overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-marquee items-center hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-3 pr-3" aria-hidden={copy === 1}>
              {logos.map((l) => (
                <span key={l.name} className="rounded-xl border border-line bg-card px-4 py-2.5">
                  <LogoChip name={l.name} showLabel />
                </span>
              ))}
              {textOnly.map((t) => (
                <span key={t} className="rounded-xl border border-line bg-card px-4 py-2.5 font-mono text-xs whitespace-nowrap text-muted">
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
