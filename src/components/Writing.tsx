import { ArrowUpRight } from "lucide-react";
import { posts } from "virtual:blog-posts";
import { Reveal, Section, useSpotlight } from "./ui";

const fmt = (d: string) => {
  const t = Date.parse(d);
  return Number.isNaN(t) ? d : new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export const hasPosts = posts.length > 0;

export default function Writing({ index }: { index: string }) {
  const spot = useSpotlight();
  if (!posts.length) return null;
  const single = posts.length === 1;
  return (
    <Section
      id="writing"
      index={index}
      eyebrow="Writing"
      title={
        <>
          Notes from building <span className="text-gradient">AI systems</span>.
        </>
      }
      subtitle="RAG, agents, LLM security and evaluation: what I build, how I test it, and what I'd change."
    >
      <div className={`grid gap-4 ${single ? "" : posts.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}>
        {posts.map((p, i) => (
          <Reveal key={p.slug} delay={i * 0.05}>
            <a
              href={`./blog/${p.slug}/`}
              onMouseMove={spot}
              className={`spotlight group flex h-full rounded-2xl border border-line bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-line-strong ${
                single ? "flex-col gap-4 md:flex-row md:items-center md:gap-10 md:p-8" : "flex-col"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
                  {fmt(p.date)} · {p.readingTime} min read
                  {p.draft && <span className="ml-2 rounded bg-warn/15 px-1.5 py-0.5 text-warn normal-case tracking-normal">draft · dev only</span>}
                </p>
                <h3 className={`mt-3 font-display font-semibold leading-snug tracking-tight text-fg ${single ? "text-2xl md:text-3xl" : "text-xl"}`}>{p.title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">{p.summary}</p>
                {single && <Tags tags={p.tags} className="mt-5" />}
              </div>
              <div className={`flex flex-wrap items-center gap-2 ${single ? "" : "mt-auto pt-6"}`}>
                {!single && <Tags tags={p.tags} />}
                <span className={`inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent ${single ? "" : "ml-auto"}`}>
                  Read <ArrowUpRight className="size-4 transition-transform group-hover:rotate-45" />
                </span>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <a href="./blog/" className="mt-5 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-fg">
          All writing <ArrowUpRight className="size-4" />
        </a>
      </Reveal>
    </Section>
  );
}

function Tags({ tags, className = "" }: { tags: string[]; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.slice(0, 4).map((t) => (
        <span key={t} className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-muted">
          {t}
        </span>
      ))}
    </div>
  );
}
