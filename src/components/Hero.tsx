import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Download, MapPin, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { profile } from "../data/portfolio";
import AgentTrace from "./AgentTrace";
import NeuralBackground from "./NeuralBackground";
import { GithubIcon, LinkedinIcon, useUI } from "./ui";

function useTypewriter(words: string[], { type = 70, erase = 35, hold = 1600 } = {}) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [text, setText] = useState(reduce ? words[0] : "");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const word = words[i % words.length];
    let id: number;
    if (!deleting && text === word) id = window.setTimeout(() => setDeleting(true), hold);
    else if (deleting && text === "") {
      setDeleting(false);
      setI((n) => n + 1);
      return;
    } else
      id = window.setTimeout(
        () => setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1)),
        deleting ? erase : type,
      );
    return () => window.clearTimeout(id);
  }, [text, deleting, i, words, type, erase, hold, reduce]);

  return text;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const { openChat } = useUI();
  const role = useTypewriter(profile.roles);
  const reduce = useReducedMotion();
  const fade = (d: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay: d, ease } };

  return (
    <section id="top" className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-24 pb-16">
      {/* background layers */}
      <div className="bg-grid absolute inset-0 -z-20 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute -top-40 left-1/2 -z-20 h-[560px] w-[900px] -translate-x-1/2 animate-float-slow rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--accent)_22%,transparent),transparent)] blur-2xl" />
      <div className="absolute top-1/3 -right-40 -z-20 h-[420px] w-[520px] animate-float-slow rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--accent-2)_20%,transparent),transparent)] blur-2xl [animation-delay:-6s]" />
      <NeuralBackground className="-z-10 opacity-70" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-bg" />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        <div>
          <motion.div {...fade(0)} className="mb-7 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs text-muted backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-ok" />
              </span>
              Building production GenAI @ {profile.company}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs text-muted backdrop-blur">
              <MapPin className="size-3" /> {profile.location}
            </span>
          </motion.div>

          <motion.p {...fade(0.05)} className="mb-3 font-mono text-sm text-accent">
            Hi, I'm
          </motion.p>
          <motion.h1
            {...fade(0.1)}
            className="font-display text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] font-bold tracking-[-0.035em] text-fg"
          >
            Alivelli
            <br />
            <span className="text-gradient">Ashwanth</span>
          </motion.h1>

          <motion.div {...fade(0.2)} className="mt-6 flex h-9 items-center font-mono text-lg text-fg sm:text-xl">
            <span className="mr-2 text-subtle">&gt;</span>
            <span>{role}</span>
            <span className="ml-0.5 inline-block h-6 w-[2px] animate-blink bg-accent" aria-hidden="true" />
            <span className="sr-only">{profile.roles.join(", ")}</span>
          </motion.div>

          <motion.p {...fade(0.3)} className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {profile.tagline}
          </motion.p>

          <motion.div {...fade(0.4)} className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#projects"
              className="group inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5 hover:shadow-accent/35"
            >
              View my work
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <button
              onClick={() => openChat()}
              className="group inline-flex items-center gap-2 rounded-xl border border-line-strong bg-card px-5 py-3 text-sm font-semibold text-fg backdrop-blur transition-all hover:-translate-y-0.5 hover:border-accent/60"
            >
              <Sparkles className="size-4 text-accent" />
              Ask my AI
            </button>
            <a
              href={`./${profile.resume}`}
              download
              className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-muted transition-colors hover:text-fg"
            >
              <Download className="size-4" /> Resume
            </a>
          </motion.div>

          <motion.div {...fade(0.5)} className="mt-9 flex items-center gap-5 text-subtle">
            <a href={profile.socials.github} target="_blank" rel="noreferrer" className="transition-colors hover:text-fg" aria-label="GitHub">
              <GithubIcon className="size-5" />
            </a>
            <a href={profile.socials.linkedin} target="_blank" rel="noreferrer" className="transition-colors hover:text-fg" aria-label="LinkedIn">
              <LinkedinIcon className="size-5" />
            </a>
            <span className="h-px w-10 bg-line-strong" />
            <a href={`mailto:${profile.email}`} className="font-mono text-xs transition-colors hover:text-fg">
              {profile.email}
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease }}
          className="relative"
        >
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-accent/15 via-transparent to-accent-2/15 blur-2xl" />
          <AgentTrace />
          <p className="mt-3 text-center font-mono text-[11px] text-subtle">
            illustrative traces of systems I've built · hover to pause
          </p>
        </motion.div>
      </div>

      <a
        href="#about"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-subtle transition-colors hover:text-fg md:flex"
        aria-label="Scroll to About"
      >
        scroll
        <span className="relative h-9 w-5 rounded-full border border-line-strong">
          <motion.span
            className="absolute left-1/2 top-1.5 size-1 -translate-x-1/2 rounded-full bg-accent"
            animate={reduce ? undefined : { y: [0, 14, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </a>
    </section>
  );
}
