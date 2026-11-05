/**
 * Lexical grounding check: is every sentence of an answer supported by the source?
 *
 * For each answer sentence:
 *  - coverage: share of its content words (stemmed) found in the best-matching source sentence
 *  - numbers:  every number in the answer must appear in the source ("fifteen" == "15")
 *  - names:    capitalised terms (orgs, products, acronyms) must appear in the source
 * Production systems add an NLI model or an LLM judge; the principle is the same.
 */
import { profile } from "../data/portfolio";
import { sampleDocs } from "./chunk";
import { tokenize } from "./assistant";

export type Verdict = "supported" | "partial" | "unsupported";
export type SentenceCheck = {
  text: string;
  verdict: Verdict;
  coverage: number;
  source: number | null; // index of best source sentence
  sources: number[]; // all source sentences used as evidence
  missingNumbers: string[];
  missingNames: string[];
  missingWords: string[];
};
export type GroundingReport = { sentences: SentenceCheck[]; sourceSentences: string[]; score: number; ms: number };

const WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, hundred: 100, thousand: 1000,
};

export function splitSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

function numbersIn(s: string) {
  const out = new Set<string>();
  for (const m of s.matchAll(/\d+(?:[.,]\d+)?/g)) out.add(String(parseFloat(m[0].replace(",", ""))));
  for (const m of s.toLowerCase().matchAll(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|hundred|thousand)\b/g))
    out.add(String(WORDS[m[1]]));
  return out;
}

const NAME_STOP = new Set(["The", "A", "An", "This", "That", "These", "It", "He", "She", "They", "We", "I", "In", "On", "At", "For", "Every", "Each", "When", "Before", "After", "Within", "Large", "Other", "Systems", "Evidence", "Affected", "Related", "Reviewers"]);

function namesIn(s: string) {
  const out: string[] = [];
  const words = s.replace(/[“”"(),:;]/g, " ").split(/\s+/);
  words.forEach((w, i) => {
    const clean = w.replace(/[.!?']+$/g, "").replace(/'s$/, "");
    if (!clean) return;
    const isAcronym = /^[A-Z]{2,}[0-9]*$/.test(clean);
    const isProper = /^[A-Z][a-z]+[A-Za-z]*$/.test(clean) && i > 0 && !NAME_STOP.has(clean);
    if (isAcronym || isProper) out.push(clean);
  });
  return out;
}

export function checkGrounding(source: string, answer: string): GroundingReport {
  const t0 = performance.now();
  const src = splitSentences(source);
  const srcTok = src.map((s) => new Set(tokenize(s)));
  const allSrcTok = new Set(srcTok.flatMap((s) => [...s]));
  const srcNums = numbersIn(source);

  const srcWords = source.split(/[\s\-–—/]+/).map((w) => w.replace(/[^A-Za-z]/g, "")).filter(Boolean);
  const nameInSource = (n: string) => {
    if (new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(source)) return true;
    // acronym expansion, e.g. RAG ↔ "Retrieval-Augmented Generation"
    if (/^[A-Z]{2,}$/.test(n))
      for (let i = 0; i + n.length <= srcWords.length; i++)
        if (srcWords.slice(i, i + n.length).every((w, k) => w[0] === n[k])) return true; // capitalised words only
    return false;
  };

  const sentences: SentenceCheck[] = splitSentences(answer).map((text) => {
    const toks = [...new Set(tokenize(text))];
    const hits = srcTok.map((st, i) => ({ i, set: st, n: toks.filter((t) => st.has(t)).length })).sort((a, b) => b.n - a.n);
    const best = hits[0]?.n ? hits[0] : null;
    // A claim may combine two source sentences: take the union of the best two.
    const second = hits[1]?.n ? hits[1] : null;
    const single = best ? best.n / (toks.length || 1) : 0;
    const union = best && second ? toks.filter((t) => best.set.has(t) || second.set.has(t)).length / (toks.length || 1) : single;
    const useTwo = union - single >= 0.15;
    const coverage = useTwo ? union : single;
    const missingWords = toks.filter((t) => !allSrcTok.has(t)).slice(0, 6);
    const missingNumbers = [...numbersIn(text)].filter((n) => !srcNums.has(n));
    const missingNames = [...new Set(namesIn(text))].filter((n) => !nameInSource(n));
    let verdict: Verdict = coverage >= 0.7 ? "supported" : coverage >= 0.4 ? "partial" : "unsupported";
    if (verdict === "supported" && missingWords.length >= 3) verdict = "partial";
    if (missingNumbers.length || missingNames.length) verdict = "unsupported";
    const sources = best ? (useTwo && second ? [best.i, second.i].sort((a, b) => a - b) : [best.i]) : [];
    return { text, verdict, coverage, source: best ? best.i : null, sources, missingNumbers, missingNames, missingWords };
  });

  const w = { supported: 1, partial: 0.5, unsupported: 0 } as const;
  const score = sentences.length ? Math.round((sentences.reduce((a, s) => a + w[s.verdict], 0) / sentences.length) * 100) : 0;
  return { sentences, sourceSentences: src, score, ms: performance.now() - t0 };
}

const runbook = sampleDocs.find((d) => d.id === "runbook")!.text.split("\n\n").slice(1, 3).join(" ");
const filing = sampleDocs.find((d) => d.id === "filing")!.text.split("\n\n").slice(2, 4).join(" ");

export const groundingPresets: { label: string; source: string; answer: string }[] = [
  {
    label: "Incident runbook",
    source: runbook,
    answer:
      "The on-call analyst confirms whether an alert is a true positive within thirty minutes. Related alerts from the same host are grouped into a single incident. In the first hour the analyst notifies the CISO and opens an incident channel. Suspicious hosts are isolated from the network and evidence is preserved before cleanup.",
  },
  {
    label: "Rate filing",
    source: filing,
    answer:
      "Loss development factors are selected from paid and incurred triangles. Reviewers compare the selected factors with the ten-year average. Large losses are capped before development. Defense and cost containment expenses are projected together with losses using an AI model.",
  },
  {
    label: "About Ashwanth",
    source: profile.summary.join(" "),
    answer:
      "Ashwanth is an AI Engineer with 1.5+ years of experience building production Generative AI for cybersecurity and insurance. He builds RAG systems and AI agents with LangChain, LangGraph and FastAPI. He previously worked at Google for five years. He fine-tunes open-source LLMs with LoRA and QLoRA.",
  },
];
