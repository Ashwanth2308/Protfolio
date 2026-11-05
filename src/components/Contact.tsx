import { ArrowUp, ArrowUpRight, Check, Copy, Download, MapPin, Send, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { profile } from "../data/portfolio";
import { useCopy } from "../hooks/hooks";
import { track } from "../lib/analytics";
import { hasPosts } from "./Writing";
import { GithubIcon, LinkedinIcon, Reveal, Section, useUI } from "./ui";

const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT;
const FORM_KEY = import.meta.env.VITE_FORM_ACCESS_KEY;

type Status = "idle" | "sending" | "sent" | "error";

export default function Contact({ index = "08" }: { index?: string }) {
  const { copied, copy } = useCopy();
  const { openChat } = useUI();
  const [form, setForm] = useState({ name: "", email: "", message: "", company: "" });
  const [status, setStatus] = useState<Status>("idle");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    track("contact_submit", { via: FORM_ENDPOINT ? "form" : "email" });
    if (!FORM_ENDPOINT) {
      const subject = encodeURIComponent(`Portfolio enquiry from ${form.name || "a visitor"}`);
      const body = encodeURIComponent(`${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ""}`);
      window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
      return;
    }
    // Honeypot: real people never see or fill the "company" field.
    if (form.company) {
      setStatus("sent");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          _subject: `Portfolio enquiry from ${form.name}`,
          subject: `Portfolio enquiry from ${form.name}`,
          ...(FORM_KEY ? { access_key: FORM_KEY } : {}),
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  const links = [
    { label: "LinkedIn", value: "ashwanth-reddy-alivelli", href: profile.socials.linkedin, icon: <LinkedinIcon className="size-[18px]" /> },
    { label: "GitHub", value: "AlivelliAshwanth", href: profile.socials.github, icon: <GithubIcon className="size-[18px]" /> },
  ];

  return (
    <Section
      id="contact"
      index={index}
      eyebrow="Contact"
      title={
        <>
          Let's build something <span className="text-gradient">intelligent</span>.
        </>
      }
      subtitle="Whether it's a RAG system, an agent, or securing the LLMs you already run, I'd like to hear about it."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Reveal className="flex flex-col gap-3">
          <div className="rounded-2xl border border-line bg-card p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-subtle">Write to me</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a href={`mailto:${profile.email}`} className="font-display text-lg font-semibold break-all text-fg hover:text-accent sm:text-xl">
                {profile.email}
              </a>
              <button
                onClick={() => copy(profile.email)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
                aria-label="Copy email address"
              >
                {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <MapPin className="size-4 text-accent" /> {profile.location} · IST (UTC+5:30)
            </p>
          </div>

          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-line bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-line-strong"
            >
              <span className="grid size-10 place-items-center rounded-xl border border-line bg-bg/40 text-fg">{l.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-subtle">{l.label}</span>
                <span className="block truncate text-sm text-fg">{l.value}</span>
              </span>
              <ArrowUpRight className="size-4 text-subtle transition-all group-hover:rotate-45 group-hover:text-accent" />
            </a>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`./${profile.resume}`}
              onClick={() => track("resume_download")}
              download
              className="flex items-center justify-center gap-2 rounded-2xl bg-fg p-4 text-sm font-medium text-bg transition-transform hover:-translate-y-0.5"
            >
              <Download className="size-4" /> Resume
            </a>
            <button
              onClick={() => openChat()}
              className="flex items-center justify-center gap-2 rounded-2xl border border-line-strong p-4 text-sm font-medium text-fg transition-all hover:-translate-y-0.5 hover:border-accent/60"
            >
              <Sparkles className="size-4 text-accent" /> Ask my AI
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <form onSubmit={submit} className="ring-gradient relative h-full rounded-2xl border border-line bg-card p-6 md:p-7" aria-busy={status === "sending"}>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-subtle">Send a message</p>
            {status === "sent" ? (
              <div className="flex h-[calc(100%-2rem)] min-h-[300px] flex-col items-center justify-center text-center" role="status">
                <span className="grid size-14 place-items-center rounded-2xl border border-ok/40 bg-ok/10 text-ok">
                  <Check className="size-7" />
                </span>
                <p className="mt-5 font-display text-xl font-semibold text-fg">Message sent</p>
                <p className="mt-2 max-w-xs text-sm text-muted">
                  Thanks{form.name ? `, ${form.name.split(" ")[0]}` : ""}. I'll reply to {form.email || "you"} soon.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ name: "", email: "", message: "", company: "" });
                    setStatus("idle");
                  }}
                  className="mt-6 rounded-xl border border-line px-4 py-2 text-sm text-fg hover:border-line-strong"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field id="contact-name" label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} autoComplete="name" required />
                  <Field
                    id="contact-email"
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                    autoComplete="email"
                    required={!!FORM_ENDPOINT}
                  />
                </div>
                {/* honeypot for bots, hidden from people and screen readers */}
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="absolute -left-[9999px] size-px opacity-0"
                  aria-hidden="true"
                />
                <label className="mt-4 block" htmlFor="contact-message">
                  <span className="mb-1.5 block text-xs text-muted">Message</span>
                  <textarea
                    id="contact-message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell me about the role, project or idea…"
                    className="w-full resize-none rounded-xl border border-line bg-bg/50 px-4 py-3 text-sm text-fg placeholder:text-subtle focus:border-accent/60 focus:outline-none"
                  />
                </label>
                {status === "error" && (
                  <p className="mt-3 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-fg" role="alert">
                    The message didn't go through. Please try again, or email me at {profile.email}.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/25 disabled:translate-y-0 disabled:opacity-60"
                >
                  {status === "sending" ? "Sending…" : "Send message"} <Send className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <p className="mt-3 text-center text-xs text-subtle">
                  {FORM_ENDPOINT ? "Goes straight to my inbox. I usually reply within a day." : "Opens your email app with the message pre-filled."}
                </p>
              </>
            )}
          </form>
        </Reveal>
      </div>
    </Section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-bg/50 px-4 py-3 text-sm text-fg placeholder:text-subtle focus:border-accent/60 focus:outline-none"
      />
    </label>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-subtle sm:flex-row sm:px-8">
        <p>
          © {new Date().getFullYear()} {profile.name}. Designed & built with React, Tailwind & Motion.
        </p>
        <div className="flex items-center gap-4">
          {hasPosts && (
            <a href="./blog/" className="hover:text-fg">
              Writing
            </a>
          )}
          <a href={profile.socials.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-fg">
            <GithubIcon className="size-4" />
          </a>
          <a href={profile.socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-fg">
            <LinkedinIcon className="size-4" />
          </a>
          <a href="#top" className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs hover:border-line-strong hover:text-fg">
            <ArrowUp className="size-3.5" /> Top
          </a>
        </div>
      </div>
    </footer>
  );
}
