import { MotionConfig } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import About from "./components/About";
import AILab from "./components/AILab";
import AskAI from "./components/AskAI";
import CommandPalette from "./components/CommandPalette";
import Contact, { Footer } from "./components/Contact";
import Education from "./components/Education";
import Experience from "./components/Experience";
import FitCheck from "./components/FitCheck";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import ProjectModal from "./components/ProjectModal";
import Projects from "./components/Projects";
import RecruiterView from "./components/RecruiterView";
import Skills from "./components/Skills";
import { UIContext } from "./components/ui";
import { useTheme } from "./hooks/hooks";

/** Soft glow that follows the pointer (desktop pointers only). */
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        ref.current?.style.setProperty("--cx", `${e.clientX}px`);
        ref.current?.style.setProperty("--cy", `${e.clientY}px`);
        if (ref.current) ref.current.style.opacity = "1";
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 opacity-0 transition-opacity duration-700"
      style={{
        background:
          "radial-gradient(600px circle at var(--cx, 50%) var(--cy, 30%), color-mix(in oklab, var(--accent) 7%, transparent), transparent 60%)",
      }}
    />
  );
}

export default function App() {
  const { theme, toggle } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [recruiterOpen, setRecruiterOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const openChat = useCallback((question?: string) => {
    setPaletteOpen(false);
    if (question) setPending(question);
    setChatOpen(true);
  }, []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const openRecruiter = useCallback(() => {
    setPaletteOpen(false);
    setRecruiterOpen(true);
  }, []);
  const closeRecruiter = useCallback(() => setRecruiterOpen(false), []);
  const openProject = useCallback((id: string) => setProjectId(id), []);
  const closeProject = useCallback(() => setProjectId(null), []);
  const clearPending = useCallback(() => setPending(null), []);

  // ⌘K / Ctrl+K command palette, "/" opens the assistant
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === "/" && !/input|textarea/i.test((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        openChat();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openChat]);

  // Deep link: ?recruiter or #recruiter opens the quick view (handy to share with hiring teams)
  useEffect(() => {
    if (/[?&]recruiter\b/.test(window.location.search) || window.location.hash === "#recruiter") setRecruiterOpen(true);
  }, []);

  const ui = useMemo(() => ({ openChat, openPalette, openRecruiter, openProject }), [openChat, openPalette, openRecruiter, openProject]);

  return (
    <MotionConfig reducedMotion="user">
      <UIContext.Provider value={ui}>
        <a
          href="#about"
          className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink focus:translate-y-0"
        >
          Skip to content
        </a>
        <CursorGlow />
        <Navbar theme={theme} onToggleTheme={toggle} />
        <main>
          <Hero />
          <About />
          <Experience onOpenProject={setProjectId} />
          <Projects onOpen={setProjectId} />
          <AILab />
          <Skills />
          <Education />
          <FitCheck />
          <Contact />
        </main>
        <Footer />

        <ProjectModal id={projectId} onClose={closeProject} onNavigate={setProjectId} />
        <RecruiterView open={recruiterOpen} onClose={closeRecruiter} />
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          onToggleTheme={toggle}
          onAsk={openChat}
          onOpenProject={setProjectId}
          onOpenRecruiter={openRecruiter}
        />
        <AskAI open={chatOpen} onOpenChange={setChatOpen} pending={pending} onPendingHandled={clearPending} />
      </UIContext.Provider>
    </MotionConfig>
  );
}
