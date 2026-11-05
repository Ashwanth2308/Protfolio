import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUp, ChevronDown, CornerDownRight, Mic, RotateCcw, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { profile } from "../data/portfolio";
import { ask, starterQuestions, type AssistantReply } from "../lib/assistant";
import { track } from "../lib/analytics";
import { RichText } from "./ui";

type Msg = { id: number; role: "user" | "assistant"; text: string; reply?: AssistantReply; done: boolean };

const welcome = (): Msg => ({
  id: 0,
  role: "assistant",
  text: `Hi! I'm ${profile.firstName}'s AI assistant, a small RAG system running right in your browser. Ask me anything about his experience, projects or skills.`,
  done: true,
});

export default function AskAI({
  open,
  onOpenChange,
  pending,
  onPendingHandled,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pending: string | null;
  onPendingHandled: () => void;
}) {
  const reduce = useReducedMotion();
  const [msgs, setMsgs] = useState<Msg[]>([welcome()]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }));
  }, []);

  const send = useCallback(
    (q: string) => {
      const question = q.trim();
      if (!question || busy) return;
      setInput("");
      setBusy(true);
      const uid = nextId.current++;
      const aid = nextId.current++;
      setMsgs((m) => [...m, { id: uid, role: "user", text: question, done: true }]);
      track("chat_question");
      scrollDown();

      const deliver = (reply: AssistantReply) => {
        setMsgs((m) => [...m, { id: aid, role: "assistant", text: "", reply, done: false }]);
        const words = reply.answer.split(/(\s+)/);
        if (reduce) {
          setMsgs((m) => m.map((x) => (x.id === aid ? { ...x, text: reply.answer, done: true } : x)));
          setBusy(false);
          scrollDown();
          return;
        }
        let i = 0;
        const tick = () => {
          i = Math.min(words.length, i + 3);
          const text = words.slice(0, i).join("");
          const done = i >= words.length;
          setMsgs((m) => m.map((x) => (x.id === aid ? { ...x, text, done } : x)));
          scrollDown();
          if (!done) timers.current.push(window.setTimeout(tick, 28));
          else setBusy(false);
        };
        tick();
      };

      // "thinking" → retrieve → stream answer
      timers.current.push(window.setTimeout(() => deliver(ask(question)), reduce ? 0 : 420));
    },
    [busy, reduce, scrollDown],
  );

  const voice = useVoice((text) => send(text), setInput);

  // handle questions passed in from elsewhere on the page
  useEffect(() => {
    if (open && pending) {
      send(pending);
      onPendingHandled();
    }
  }, [open, pending, send, onPendingHandled]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 250);
    const onKey = (e: KeyboardEvent) => open && e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setBusy(false);
    setMsgs([welcome()]);
  };

  const goTo = (section: string) => {
    if (window.innerWidth < 640) onOpenChange(false);
    document.getElementById(section)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  const last = msgs[msgs.length - 1];
  const chips = last.role === "assistant" && last.done ? (last.reply?.followUps ?? starterQuestions) : [];

  return (
    <>
      {/* launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            onClick={() => onOpenChange(true)}
            className="group fixed right-4 bottom-4 z-[70] flex items-center gap-2.5 rounded-full border border-line-strong bg-elev/90 p-2 text-sm sm:pr-4 font-medium text-fg shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform hover:-translate-y-0.5 sm:right-6 sm:bottom-6 light:shadow-slate-400/30"
            aria-label="Open AI assistant"
          >
            <span className="relative grid size-9 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-accent-ink">
              <Sparkles className="size-4" />
              <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-elev bg-ok" />
            </span>
            <span className="hidden sm:inline">Ask my AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[75] flex flex-col overflow-hidden border-line-strong bg-elev shadow-2xl sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(640px,calc(100svh-6rem))] sm:w-[420px] sm:rounded-3xl sm:border light:shadow-slate-400/40"
            role="dialog"
            aria-label="AI assistant"
          >
            {/* header */}
            <div className="relative flex items-center gap-3 border-b border-line px-4 py-3.5">
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-accent/10 via-transparent to-accent-2/10" />
              <span className="relative grid size-10 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 font-display text-sm font-bold text-accent-ink">
                {profile.initials}
                <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-elev bg-ok" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[15px] font-semibold text-fg">Ask {profile.firstName}'s AI</div>
                <div className="truncate font-mono text-[10.5px] text-subtle">in-browser RAG · no API calls</div>
              </div>
              <button
                onClick={reset}
                className="grid size-8 place-items-center rounded-full text-subtle transition-colors hover:bg-card hover:text-fg"
                aria-label="Reset conversation"
                title="Reset"
              >
                <RotateCcw className="size-4" />
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="grid size-8 place-items-center rounded-full text-subtle transition-colors hover:bg-card hover:text-fg"
                aria-label="Close assistant"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* messages */}
            <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
              {msgs.map((m) => (
                <Bubble key={m.id} m={m} onSource={goTo} />
              ))}
              {busy && last.role === "user" && (
                <div className="flex items-center gap-2 pl-1 font-mono text-[11px] text-subtle">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="size-1.5 rounded-full bg-accent"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </span>
                  retrieving context…
                </div>
              )}
              {chips.length > 0 && !busy && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {chips.map((c) => (
                    <button
                      key={c}
                      onClick={() => send(c)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-left text-xs text-muted transition-colors hover:border-accent/50 hover:text-fg"
                    >
                      <CornerDownRight className="size-3 text-accent" />
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t border-line p-3"
            >
              <div className="flex items-center gap-2 rounded-2xl border border-line bg-bg/60 py-1.5 pr-1.5 pl-4 focus-within:border-accent/60">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about projects, skills, experience…"
                  className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-fg placeholder:text-subtle focus:outline-none"
                  aria-label="Your question"
                  maxLength={300}
                />
                {voice.supported && (
                  <button
                    type="button"
                    onClick={voice.listening ? voice.stop : voice.start}
                    className={`grid size-9 shrink-0 place-items-center rounded-xl border transition-colors ${
                      voice.listening ? "animate-pulse border-danger/60 bg-danger/15 text-danger" : "border-line text-subtle hover:text-fg"
                    }`}
                    aria-label={voice.listening ? "Stop voice input" : "Ask by voice"}
                    title={voice.listening ? "Listening… click to stop" : "Ask by voice"}
                  >
                    <Mic className="size-4" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!input.trim() || busy}
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink transition-opacity disabled:opacity-30"
                  aria-label="Send"
                >
                  <ArrowUp className="size-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[10.5px] text-subtle">
                Answers come only from portfolio content. For anything else, email {profile.email}
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const sectionLabel: Record<string, string> = {
  about: "About",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  education: "Education",
  contact: "Contact",
};

function Bubble({ m, onSource }: { m: Msg; onSource: (section: string) => void }) {
  const [showTrace, setShowTrace] = useState(false);
  if (m.role === "user")
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-accent-ink">{m.text}</div>
      </motion.div>
    );

  const r = m.reply;
  const sources = r?.sources.filter((s, i, arr) => arr.findIndex((x) => x.chunk.section === s.chunk.section) === i) ?? [];
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent/30 to-accent-2/30 text-accent">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 max-w-[88%]">
        <div className="prose-chat rounded-2xl rounded-tl-md border border-line bg-card px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line text-muted">
          <RichText text={m.text} />
          {!m.done && <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-blink bg-accent" />}
        </div>

        {m.done && r && (sources.length > 0 || r.trace) && (
          <div className="mt-2 space-y-2">
            {sources.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-subtle">Sources</span>
                {sources.map((s, i) => (
                  <button
                    key={s.chunk.id}
                    onClick={() => onSource(s.chunk.section)}
                    className="rounded-md border border-line bg-bg/40 px-1.5 py-0.5 font-mono text-[10.5px] text-muted transition-colors hover:border-accent/50 hover:text-accent"
                    title={`Jump to ${sectionLabel[s.chunk.section]}`}
                  >
                    [{i + 1}] {sectionLabel[s.chunk.section] ?? s.chunk.section}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowTrace((v) => !v)}
              className="inline-flex items-center gap-1 font-mono text-[10.5px] text-subtle transition-colors hover:text-accent"
              aria-expanded={showTrace}
            >
              <ChevronDown className={`size-3 transition-transform ${showTrace ? "rotate-180" : ""}`} />
              How I answered
            </button>
            <AnimatePresence>
              {showTrace && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-line bg-bg/60 p-3 font-mono text-[10.5px] leading-5 text-subtle">
                    <div>
                      <span className="text-accent">method</span> {r.trace.method}
                    </div>
                    {r.trace.tokens.length > 0 && (
                      <div className="truncate">
                        <span className="text-accent">query</span> [{r.trace.tokens.slice(0, 10).join(", ")}]
                      </div>
                    )}
                    <div>
                      <span className="text-accent">searched</span> {r.trace.candidates} chunks in {r.trace.ms.toFixed(2)}ms
                    </div>
                    {r.sources.map((s) => (
                      <div key={s.chunk.id} className="flex gap-2">
                        <span className="text-accent-2">{s.score.toFixed(2)}</span>
                        <span className="truncate">{s.chunk.title}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ───────── Voice input (Web Speech API, where the browser supports it) ───────── */
type SpeechRec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function useVoice(onFinal: (text: string) => void, onInterim: (text: string) => void) {
  const Ctor =
    typeof window !== "undefined"
      ? ((window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }).SpeechRecognition ??
        (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition)
      : undefined;
  const [listening, setListening] = useState(false);
  const rec = useRef<SpeechRec | null>(null);
  const finalRef = useRef(onFinal);
  const interimRef = useRef(onInterim);
  finalRef.current = onFinal;
  interimRef.current = onInterim;

  const start = useCallback(() => {
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      const res = Array.from(e.results);
      const text = res.map((x) => x[0].transcript).join(" ");
      if (res[res.length - 1]?.isFinal) finalRef.current(text);
      else interimRef.current(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  }, [Ctor]);

  const stop = useCallback(() => {
    rec.current?.stop();
    setListening(false);
  }, []);

  useEffect(() => () => rec.current?.stop(), []);

  return { supported: !!Ctor, listening, start, stop };
}
