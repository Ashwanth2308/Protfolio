import { AnimatePresence, motion } from "motion/react";
import { Copy, CornerDownLeft, Download, FileText, Hash, Mail, Moon, ScanSearch, Search, Sparkles, Timer } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { extraSections, navLinks, profile, projects } from "../data/portfolio";
import { useLockBody } from "../hooks/hooks";
import { demos } from "./AILab";
import { hasPosts } from "./Writing";
import { GithubIcon, LinkedinIcon } from "./ui";

/** Open an external link through a real anchor (window.open is blocked in some embedded viewers). */
function openLink(href: string) {
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

type Item = { id: string; group: string; label: string; hint?: string; icon: ReactNode; run: () => void };

export default function CommandPalette({
  open,
  onClose,
  onToggleTheme,
  onAsk,
  onOpenProject,
  onOpenRecruiter,
}: {
  open: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
  onAsk: (q?: string) => void;
  onOpenProject: (id: string) => void;
  onOpenRecruiter: () => void;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useLockBody(open);

  const items = useMemo<Item[]>(() => {
    const go = (id: string) => () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    return [
      { id: "recruiter", group: "For recruiters", label: "30-second recruiter view", icon: <Timer className="size-4" />, run: onOpenRecruiter },
      { id: "fit", group: "For recruiters", label: "Check fit against a job description", icon: <ScanSearch className="size-4" />, run: go("fit") },
      ...demos.map((d) => ({
        id: `lab-${d.id}`,
        group: "AI Lab",
        label: d.title,
        hint: d.tag,
        icon: <d.icon className="size-4" />,
        run: () => {
          window.location.hash = `lab/${d.id}`;
        },
      })),
      ...[...navLinks, ...extraSections, ...(hasPosts ? [{ id: "writing", label: "Writing" }] : [])].map((l) => ({ id: `nav-${l.id}`, group: "Navigate", label: l.label, icon: <Hash className="size-4" />, run: go(l.id) })),
      ...projects.map((p) => ({
        id: `proj-${p.id}`,
        group: "Projects",
        label: p.title,
        hint: p.category,
        icon: <FileText className="size-4" />,
        run: () => onOpenProject(p.id),
      })),
      { id: "ask", group: "Actions", label: "Ask my AI assistant", icon: <Sparkles className="size-4" />, run: () => onAsk() },
      {
        id: "resume",
        group: "Actions",
        label: "Download resume",
        icon: <Download className="size-4" />,
        run: () => {
          const a = document.createElement("a");
          a.href = `./${profile.resume}`;
          a.download = profile.resume;
          a.click();
        },
      },
      {
        id: "copy",
        group: "Actions",
        label: "Copy email address",
        hint: profile.email,
        icon: <Copy className="size-4" />,
        run: () => void navigator.clipboard?.writeText(profile.email).catch(() => {}),
      },
      { id: "theme", group: "Actions", label: "Toggle light / dark theme", icon: <Moon className="size-4" />, run: onToggleTheme },
      { id: "mail", group: "Links", label: "Send an email", icon: <Mail className="size-4" />, run: () => (window.location.href = `mailto:${profile.email}`) },
      { id: "gh", group: "Links", label: "GitHub", icon: <GithubIcon className="size-4" />, run: () => openLink(profile.socials.github) },
      { id: "li", group: "Links", label: "LinkedIn", icon: <LinkedinIcon className="size-4" />, run: () => openLink(profile.socials.linkedin) },
    ];
  }, [onAsk, onOpenProject, onToggleTheme, onOpenRecruiter]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => `${i.label} ${i.hint ?? ""} ${i.group}`.toLowerCase().includes(s));
  }, [q, items]);

  // If nothing matches, offer to ask the assistant.
  const results: Item[] = filtered.length
    ? filtered
    : [{ id: "ask-q", group: "Ask AI", label: `Ask: "${q}"`, icon: <Sparkles className="size-4" />, run: () => onAsk(q) }];

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => setSel(0), [q]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const runItem = (it: Item) => {
    onClose();
    window.setTimeout(it.run, 60);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => (s + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => (s - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = results[sel];
      if (it) runItem(it);
    } else if (e.key === "Escape") onClose();
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm light:bg-slate-900/30" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-elev shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-4 text-subtle" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder="Search sections, projects, actions, or ask a question…"
                className="h-14 flex-1 bg-transparent text-sm text-fg placeholder:text-subtle focus:outline-none"
                aria-label="Search commands"
              />
              <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-subtle">ESC</kbd>
            </div>
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
              {results.map((it, i) => {
                const header = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                return (
                  <div key={it.id}>
                    {header && (
                      <div className="px-3 pt-3 pb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">{header}</div>
                    )}
                    <button
                      data-idx={i}
                      onMouseMove={() => setSel(i)}
                      onClick={() => runItem(it)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        sel === i ? "bg-accent/10 text-fg" : "text-muted"
                      }`}
                    >
                      <span className={sel === i ? "text-accent" : "text-subtle"}>{it.icon}</span>
                      <span className="min-w-0 flex-1 truncate">{it.label}</span>
                      {it.hint && <span className="hidden shrink-0 font-mono text-[11px] text-subtle sm:inline">{it.hint}</span>}
                      {sel === i && <CornerDownLeft className="size-3.5 shrink-0 text-subtle" />}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 font-mono text-[10.5px] text-subtle">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span className="ml-auto">no match? press ↵ to ask my AI</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
