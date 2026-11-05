/**
 * Text chunking strategies used in RAG ingestion, plus BM25 over the chunks,
 * so you can see how chunk size and overlap change what gets retrieved.
 * Chunks are character ranges [start, end) over the original text.
 */
import { tokenize } from "./assistant";

export type Strategy = "fixed" | "sentence" | "recursive" | "paragraph";
export type Chunk = { i: number; start: number; end: number; text: string };
type Range = [number, number];

const mk = (text: string, ranges: Range[]): Chunk[] =>
  ranges
    .map(([s, e]) => {
      // trim whitespace at the edges so highlights hug the words
      while (s < e && /\s/.test(text[s])) s++;
      while (e > s && /\s/.test(text[e - 1])) e--;
      return [s, e] as Range;
    })
    .filter(([s, e]) => e > s)
    .map(([s, e], i) => ({ i, start: s, end: e, text: text.slice(s, e) }));

function fixed(text: string, size: number, overlap: number): Range[] {
  const out: Range[] = [];
  const step = Math.max(1, size - overlap);
  for (let s = 0; s < text.length; s += step) {
    const e = Math.min(text.length, s + size);
    out.push([s, e]);
    if (e === text.length) break;
  }
  return out;
}

/** Split into contiguous pieces at a separator, keeping the separator on the left piece. */
function splitAt(text: string, [s, e]: Range, sep: RegExp): Range[] {
  const out: Range[] = [];
  const re = new RegExp(sep.source, "g");
  const seg = text.slice(s, e);
  let last = 0;
  for (const m of seg.matchAll(re)) {
    const cut = m.index! + m[0].length;
    if (cut > last && cut < seg.length) {
      out.push([s + last, s + cut]);
      last = cut;
    }
  }
  out.push([s + last, e]);
  return out;
}

/** Greedy merge of contiguous pieces up to `size`, carrying up to `overlap` chars of trailing pieces. */
function merge(pieces: Range[], size: number, overlap: number): Range[] {
  const out: Range[] = [];
  let cur: Range[] = [];
  const len = (rs: Range[]) => (rs.length ? rs[rs.length - 1][1] - rs[0][0] : 0);
  for (const p of pieces) {
    const pl = p[1] - p[0];
    if (cur.length && len(cur) + pl > size) {
      out.push([cur[0][0], cur[cur.length - 1][1]]);
      // keep a tail for overlap
      while (cur.length && (len(cur) > overlap || len(cur) + pl > size)) cur = cur.slice(1);
    }
    cur.push(p);
  }
  if (cur.length) out.push([cur[0][0], cur[cur.length - 1][1]]);
  // drop chunks fully contained in the previous one (can happen with big overlaps)
  return out.filter((r, i) => i === 0 || r[1] > out[i - 1][1]);
}

const SENTENCE = /[.!?](?=\s)|\n+/;
const PARAGRAPH = /\n\s*\n/;

function recursive(text: string, range: Range, size: number, seps: RegExp[]): Range[] {
  if (range[1] - range[0] <= size || !seps.length) {
    if (range[1] - range[0] <= size) return [range];
    return fixed(text.slice(range[0], range[1]), size, 0).map(([s, e]) => [range[0] + s, range[0] + e] as Range);
  }
  const [sep, ...rest] = seps;
  const parts = splitAt(text, range, sep);
  if (parts.length === 1) return recursive(text, range, size, rest);
  return parts.flatMap((p) => (p[1] - p[0] > size ? recursive(text, p, size, rest) : [p]));
}

export function chunkText(text: string, strategy: Strategy, size: number, overlap: number): Chunk[] {
  const all: Range = [0, text.length];
  if (!text.trim()) return [];
  switch (strategy) {
    case "fixed":
      return mk(text, fixed(text, size, overlap));
    case "sentence":
      return mk(text, merge(splitAt(text, all, SENTENCE), size, overlap));
    case "paragraph":
      return mk(text, merge(splitAt(text, all, PARAGRAPH), size, overlap));
    case "recursive":
      return mk(text, merge(recursive(text, all, size, [PARAGRAPH, /\n/, /[.!?](?=\s)/, / /]), size, overlap));
  }
}

/** Okapi BM25 over chunk texts. Returns scores aligned with `docs`. */
export function bm25(docs: string[], query: string, k1 = 1.4, b = 0.7) {
  const q = [...new Set(tokenize(query))];
  const toks = docs.map((d) => tokenize(d));
  const N = docs.length || 1;
  const avg = toks.reduce((a, t) => a + t.length, 0) / N || 1;
  const df = new Map<string, number>();
  for (const t of toks) for (const w of new Set(t)) df.set(w, (df.get(w) ?? 0) + 1);
  return toks.map((t) => {
    const tf = new Map<string, number>();
    for (const w of t) tf.set(w, (tf.get(w) ?? 0) + 1);
    let s = 0;
    for (const w of q) {
      const f = tf.get(w);
      if (!f) continue;
      const n = df.get(w) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      s += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * t.length) / avg)));
    }
    return s;
  });
}

export const sampleDocs: { id: string; label: string; query: string; text: string }[] = [
  {
    id: "filing",
    label: "Rate filing guideline",
    query: "How are loss development factors reviewed?",
    text: `Rate Filing Review Guideline (sample document)

Purpose. This guideline describes how the actuarial team prepares a property and casualty rate filing before it is submitted to the regulator. Every number in the filing must be traceable to a source exhibit, and every assumption must cite the rule or standard that allows it.

Loss development. Loss development factors are selected from paid and incurred triangles. Reviewers compare the selected factors with the three-year and five-year averages and document any judgmental adjustment. Large losses are capped before development so that a single event does not distort the indication.

Expenses. Defense and cost containment expenses are projected separately from losses. The filing must show the historical ratio, the selected ratio and the reason for any change. Other expenses are taken from the annual statement and allocated by line of business.

Credibility. When the company's own experience is thin, it is blended with a complement of credibility. The complement and the credibility standard must both be disclosed, along with the weight given to each.

Submission checklist. Before submission, a second reviewer confirms that every exhibit is cross-referenced, that the required forms are attached, and that the filing memorandum explains each change from the prior approved rates in plain language.`,
  },
  {
    id: "runbook",
    label: "Incident runbook",
    query: "What happens in the first hour of an incident?",
    text: `Security Incident Runbook (sample document)

Triage. When an alert fires, the on-call analyst confirms whether it is a true positive within fifteen minutes. Related alerts from the same host or user are grouped into a single incident so the team works one timeline instead of many.

First hour. In the first hour the analyst assigns a severity, opens an incident channel and notifies the incident commander. Affected accounts are disabled and suspicious hosts are isolated from the network. Evidence such as memory images and logs is preserved before any cleanup begins.

Investigation. The team maps observed behavior to known attacker techniques, identifies the initial access vector and checks for lateral movement. Every finding is written into the timeline with the time, the source and the analyst who confirmed it.

Recovery. Systems are restored from known-good images, credentials are rotated and detection rules are updated so the same technique is caught earlier next time.

Review. Within five business days the team holds a blameless review. The report lists what happened, what worked, what did not, and the follow-up actions with owners and due dates.`,
  },
];
