import { motion, useReducedMotion } from "motion/react";
import {
  Award,
  Brain,
  Factory,
  Heart,
  Scale,
  Code2,
  Cpu,
  Database,
  FlaskConical,
  Layers,
  Medal,
  Server,
  ShieldCheck,
  Trophy,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode, type MouseEvent, type SVGProps } from "react";

/* ───────── Global UI context (open assistant / command palette) ───────── */
type UIContextValue = {
  openChat: (question?: string) => void;
  openPalette: () => void;
  openRecruiter: () => void;
  openProject: (id: string) => void;
};
export const UIContext = createContext<UIContextValue>({
  openChat: () => {},
  openPalette: () => {},
  openRecruiter: () => {},
  openProject: () => {},
});
export const useUI = () => useContext(UIContext);

/* ───────── Icons ───────── */
export const icons: Record<string, LucideIcon> = {
  database: Database,
  workflow: Workflow,
  shield: ShieldCheck,
  flask: FlaskConical,
  brain: Brain,
  layers: Layers,
  cpu: Cpu,
  code: Code2,
  server: Server,
  trophy: Trophy,
  medal: Medal,
  award: Award,
  scale: Scale,
  heart: Heart,
  factory: Factory,
};

export function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

/* ───────── Motion helpers ───────── */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      // Content stays visible at rest (thumbnails, link previews, no-JS crawlers); only a small slide animates in.
      initial={reduce ? false : { y }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ───────── Section shell ───────── */
export function Section({
  id,
  index,
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
}: {
  id: string;
  index: string;
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 md:py-28 ${className}`}>
      <Reveal>
        <div className="mb-12 md:mb-16">
          <div className="mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
            <span className="text-subtle">{index}</span>
            <span className="h-px w-8 bg-accent/50" />
            {eyebrow}
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl md:text-5xl">{title}</h2>
          {subtitle && <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{subtitle}</p>}
        </div>
      </Reveal>
      {children}
    </section>
  );
}

/* ───────── Small atoms ───────── */
export function Tag({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px] leading-none tracking-tight transition-colors ${
        active ? "border-accent/50 bg-accent/10 text-accent" : "border-line bg-card text-muted"
      }`}
    >
      {children}
    </span>
  );
}

/** Mouse-tracking spotlight handler for elements using the `spotlight` utility. */
export function useSpotlight() {
  return useCallback((e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);
}

/** Renders **bold** segments from assistant / data strings. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
      )}
    </>
  );
}

/* ───────── Progressive mounting ─────────
   Sections below the fold mount one per idle slot after the first paint, so the
   initial render is small and the main thread stays responsive on phones. */
const mountQueue: (() => void)[] = [];
let pumping = false;
const onIdle = (cb: () => void) => {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout: 500 });
  else window.setTimeout(cb, 16);
};
function pump() {
  if (pumping) return;
  pumping = true;
  const next = () => {
    const job = mountQueue.shift();
    if (!job) {
      pumping = false;
      window.dispatchEvent(new Event("sections-ready"));
      return;
    }
    job();
    onIdle(next);
  };
  onIdle(next);
}

export function Deferred({ id, minHeight = 720, children }: { id?: string; minHeight?: number; children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    mountQueue.push(() => alive && setReady(true));
    pump();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (ready) window.dispatchEvent(new Event("section-mounted"));
  }, [ready]);
  if (ready) return <>{children}</>;
  return id ? <div id={id} style={{ minHeight }} aria-hidden="true" /> : null;
}
