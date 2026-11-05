/**
 * Optional Claude-backed answers via the chat worker (server/chat-worker).
 * Enabled only when VITE_CHAT_API_URL is set; returns null on any problem so
 * the caller falls back to the in-browser engine.
 */
import { ask, knowledgeBase, tokenize, type AssistantReply, type Retrieved } from "./assistant";

const ENDPOINT = import.meta.env.VITE_CHAT_API_URL;
export const remoteEnabled = Boolean(ENDPOINT);

type RemoteResponse = {
  answer?: string;
  blocked?: boolean;
  fallback?: boolean;
  model?: string;
  sources?: { id: string; score?: number }[];
};

export async function askRemote(question: string): Promise<AssistantReply | null> {
  if (!ENDPOINT) return null;
  const t0 = performance.now();
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      signal: ctrl.signal,
    });
    const data = (await res.json()) as RemoteResponse;
    if (!res.ok || data.fallback || !data.answer) return null;
    const sources: Retrieved[] = (data.sources ?? []).flatMap((s) => {
      const chunk = knowledgeBase.find((c) => c.id === s.id);
      return chunk ? [{ chunk, score: s.score ?? 0 }] : [];
    });
    return {
      answer: data.answer,
      sources,
      followUps: ask(question).followUps,
      trace: {
        tokens: tokenize(question),
        ms: performance.now() - t0,
        candidates: knowledgeBase.length,
        method: data.blocked ? "guardrail · blocked before the model" : `Claude (${data.model ?? "model"}) · grounded on portfolio · guardrail passed`,
      },
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}
