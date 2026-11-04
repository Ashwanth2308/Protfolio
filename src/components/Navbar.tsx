import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { Command, Download, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { navLinks, profile } from "../data/portfolio";
import { useActiveSection, type Theme } from "../hooks/hooks";
import { useUI } from "./ui";

const ids = navLinks.map((l) => l.id);

export default function Navbar({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const active = useActiveSection(ids);
  const { openPalette } = useUI();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <motion.div
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-accent via-accent-3 to-accent-2"
        style={{ scaleX: progress }}
        aria-hidden="true"
      />
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          open ? "border-b border-line bg-elev" : scrolled ? "glass border-b border-line" : "border-b border-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 sm:px-8" aria-label="Primary">
          <a href="#top" className="group flex items-center gap-2.5" aria-label={`${profile.name} — home`}>
            <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl border border-line bg-card font-display text-sm font-bold">
              <span className="absolute inset-0 bg-gradient-to-br from-accent/25 via-transparent to-accent-2/25 opacity-80 transition-opacity group-hover:opacity-100" />
              <span className="relative text-gradient">{profile.initials}</span>
            </span>
            <span className="hidden font-display text-[15px] font-semibold tracking-tight text-fg sm:block">
              {profile.name}
            </span>
          </a>

          <ul className="ml-auto hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  className={`relative isolate rounded-lg px-3 py-2 text-sm transition-colors ${
                    active === l.id ? "text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {active === l.id && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-lg border border-line bg-card"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2 lg:ml-3">
            <button
              onClick={openPalette}
              className="hidden items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg md:flex"
              aria-label="Open command palette"
            >
              <Command className="size-3.5" />
              <span className="font-mono">{isMac ? "⌘K" : "Ctrl K"}</span>
            </button>
            <button
              onClick={onToggleTheme}
              className="grid size-9 place-items-center rounded-lg border border-line bg-card text-muted transition-colors hover:border-line-strong hover:text-fg"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </motion.span>
              </AnimatePresence>
            </button>
            <a
              href={`./${profile.resume}`}
              download
              className="hidden items-center gap-1.5 rounded-lg bg-fg px-3.5 py-2 text-sm font-medium text-bg transition-transform hover:-translate-y-0.5 sm:flex"
            >
              <Download className="size-3.5" /> Resume
            </a>
            <button
              onClick={() => setOpen((o) => !o)}
              className="grid size-9 place-items-center rounded-lg border border-line bg-card text-fg lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-line bg-elev shadow-2xl shadow-black/40 lg:hidden"
            >
              <ul className="mx-auto flex max-w-6xl flex-col px-5 py-3 sm:px-8">
                {navLinks.map((l, i) => (
                  <motion.li
                    key={l.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <a
                      href={`#${l.id}`}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between rounded-lg px-3 py-3 text-base ${
                        active === l.id ? "text-fg" : "text-muted"
                      }`}
                    >
                      {l.label}
                      <span className="font-mono text-xs text-subtle">0{i + 1}</span>
                    </a>
                  </motion.li>
                ))}
                <li className="mt-2 border-t border-line pt-3">
                  <a
                    href={`./${profile.resume}`}
                    download
                    className="flex items-center justify-center gap-2 rounded-lg bg-fg px-3 py-3 text-sm font-medium text-bg"
                  >
                    <Download className="size-4" /> Download resume
                  </a>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
