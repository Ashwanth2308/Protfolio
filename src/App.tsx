import { MotionConfig } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import About from "./components/About";
import AskAI from "./components/AskAI";
import CommandPalette from "./components/CommandPalette";
import Contact, { Footer } from "./components/Contact";
import Education from "./components/Education";
import Experience from "./components/Experience";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import ProjectModal from "./components/ProjectModal";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import { UIContext } from "./components/ui";
import { useTheme } from "./hooks/hooks";

export default function App() {
  const { theme, toggle } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const openChat = useCallback((question?: string) => {
    setPaletteOpen(false);
    if (question) setPending(question);
    setChatOpen(true);
  }, []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
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

  const ui = useMemo(() => ({ openChat, openPalette }), [openChat, openPalette]);

  return (
    <MotionConfig reducedMotion="user">
      <UIContext.Provider value={ui}>
        <a
          href="#about"
          className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink focus:translate-y-0"
        >
          Skip to content
        </a>
        <Navbar theme={theme} onToggleTheme={toggle} />
        <main>
          <Hero />
          <About />
          <Experience onOpenProject={setProjectId} />
          <Projects onOpen={setProjectId} />
          <Skills />
          <Education />
          <Contact />
        </main>
        <Footer />

        <ProjectModal id={projectId} onClose={closeProject} onNavigate={setProjectId} />
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          onToggleTheme={toggle}
          onAsk={openChat}
          onOpenProject={setProjectId}
        />
        <AskAI open={chatOpen} onOpenChange={setChatOpen} pending={pending} onPendingHandled={clearPending} />
      </UIContext.Provider>
    </MotionConfig>
  );
}
