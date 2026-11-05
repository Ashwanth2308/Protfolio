import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { bm25, chunkText, sampleDocs, type Strategy } from "../../lib/chunk";
import { Chip, LabNote, PanelTitle, Segmented, Slider } from "./shared";

const strategies: { value: Strategy; label: string }[] = [
  { value: "recursive", label: "Recursive" },
  { value: "sentence", label: "Sentence" },
  { value: "fixed", label: "Fixed-size" },
  { value: "paragraph", label: "Paragraph" },
];

const strategyHint: Record<Strategy, string> = {
  recursive: "Splits on paragraphs, then lines, sentences and words until pieces fit (LangChain-style), then packs them up to the size.",
  sentence: "Never cuts a sentence in half, so a long sentence can exceed the target size.",
  fixed: "Cuts every N characters regardless of meaning. Fast, but often splits mid-word.",
  paragraph: "Keeps whole paragraphs together and packs small ones up to the size.",
};

export default function ChunkLab() {
  const [docId, setDocId] = useState(sampleDocs[0].id);
  const [custom, setCustom] = useState("Paste any document here to see how it would be chunked for retrieval.\n\nTry changing the strategy, size and overlap.");
  const [strategy, setStrategy] = useState<Strategy>("recursive");
  const [size, setSize] = useState(320);
  const [overlapPct, setOverlapPct] = useState(15);
  const [query, setQuery] = useState(sampleDocs[0].query);
  const [hover, setHover] = useState<number | null>(null);

  const doc = sampleDocs.find((d) => d.id === docId);
  const text = doc ? doc.text : custom;
  const overlap = Math.round((size * overlapPct) / 100);
  const chunks = useMemo(() => chunkText(text, strategy, size, overlap), [text, strategy, size, overlap]);
  const scores = useMemo(() => bm25(chunks.map((c) => c.text), query), [chunks, query]);
  const ranked = useMemo(() => chunks.map((c) => ({ c, s: scores[c.i] ?? 0 })).sort((a, b) => b.s - a.s), [chunks, scores]);
  const top = query.trim() && ranked[0]?.s > 0 ? ranked[0].c.i : null;
  const focus = hover ?? top;
  const maxScore = ranked[0]?.s || 1;

  // stats
  const covered = chunks.reduce((a, c) => a + (c.end - c.start), 0);
  const unique = new Set(chunks.flatMap((c) => Array.from({ length: c.end - c.start }, (_, k) => c.start + k))).size;
  const dup = covered ? Math.round(((covered - unique) / covered) * 100) : 0;
  const avg = chunks.length ? Math.round(covered / chunks.length) : 0;

  // segments of constant coverage for highlighting
  const segments = useMemo(() => {
    const cuts = new Set<number>([0, text.length]);
    for (const c of chunks) {
      cuts.add(c.start);
      cuts.add(c.end);
    }
    const pts = [...cuts].sort((a, b) => a - b);
    const out: { s: number; e: number; ids: number[]; startsChunk?: number }[] = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const s = pts[k];
      const e = pts[k + 1];
      const ids = chunks.filter((c) => c.start <= s && c.end >= e).map((c) => c.i);
      out.push({ s, e, ids, startsChunk: chunks.find((c) => c.start === s)?.i });
    }
    return out;
  }, [chunks, text]);

  const pickDoc = (id: string) => {
    setDocId(id);
    const d = sampleDocs.find((x) => x.id === id);
    setQuery(d ? d.query : "");
    setHover(null);
  };

  return (
    <div className="p-5 md:p-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr_1fr]">
        <div>
          <PanelTitle n={1}>Document</PanelTitle>
          <div className="flex flex-wrap gap-1.5">
            {sampleDocs.map((d) => (
              <Chip key={d.id} active={docId === d.id} onClick={() => pickDoc(d.id)}>
                {d.label}
              </Chip>
            ))}
            <Chip active={docId === "custom"} onClick={() => pickDoc("custom")}>
              Your text
            </Chip>
          </div>
        </div>
        <div>
          <PanelTitle n={2}>Strategy</PanelTitle>
          <Segmented label="Chunking strategy" options={strategies} value={strategy} onChange={setStrategy} />
          <p className="mt-2 text-[11px] leading-snug text-subtle">{strategyHint[strategy]}</p>
        </div>
        <div className="grid gap-4">
          <Slider label="Chunk size" value={size} min={80} max={800} step={20} onChange={setSize} format={(v) => `${v} chars ≈ ${Math.round(v / 4)} tokens`} />
          <Slider label="Overlap" value={overlapPct} min={0} max={40} step={5} onChange={setOverlapPct} format={(v) => `${v}% · ${overlap} chars`} />
        </div>
      </div>

      {docId === "custom" && (
        <textarea
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          rows={5}
          className="mt-5 w-full resize-y rounded-xl border border-line bg-bg/60 p-4 text-sm text-fg focus:border-accent/60 focus:outline-none"
          aria-label="Your document"
        />
      )}

      {/* stats */}
      <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { k: "Chunks", v: String(chunks.length) },
          { k: "Avg size", v: `${avg} chars` },
          { k: "≈ Tokens / chunk", v: String(Math.round(avg / 4)) },
          { k: "Duplicated by overlap", v: `${dup}%` },
        ].map((x) => (
          <div key={x.k} className="rounded-xl border border-line bg-bg/40 px-3 py-2.5">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-subtle">{x.k}</dt>
            <dd className="mt-0.5 font-display text-lg font-semibold text-fg">{x.v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        {/* highlighted document */}
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <PanelTitle n={3}>Chunks in the document</PanelTitle>
            <span className="-mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted">
              <Swatch c="color-mix(in oklab, var(--series-1) 22%, transparent)" /> chunk
              <Swatch c="color-mix(in oklab, var(--series-3) 22%, transparent)" /> next chunk
              <Swatch c="color-mix(in oklab, var(--series-2) 38%, transparent)" /> overlap
            </span>
          </div>
          <div className="max-h-[460px] overflow-y-auto rounded-2xl border border-line bg-bg/50 p-4 text-[13.5px] leading-[1.9] whitespace-pre-wrap text-muted" onMouseLeave={() => setHover(null)}>
            {segments.map((seg, k) => {
              const t = text.slice(seg.s, seg.e);
              if (!seg.ids.length) return <span key={k}>{t}</span>;
              const isOverlap = seg.ids.length > 1;
              const owner = seg.ids[seg.ids.length - 1];
              const focused = focus !== null && seg.ids.includes(focus);
              const dim = focus !== null && !focused;
              const bg = isOverlap
                ? `color-mix(in oklab, var(--series-2) ${focused ? 50 : 34}%, transparent)`
                : `color-mix(in oklab, var(${owner % 2 ? "--series-3" : "--series-1"}) ${focused ? 38 : 18}%, transparent)`;
              return (
                <span
                  key={k}
                  onMouseEnter={() => setHover(owner)}
                  className={`rounded-[3px] transition-[background-color,opacity] duration-200 [box-decoration-break:clone] ${focused ? "text-fg" : ""} ${dim ? "opacity-60" : ""}`}
                  style={{ backgroundColor: bg }}
                >
                  {seg.startsChunk !== undefined && (
                    <span className="mr-1 inline-block -translate-y-px rounded bg-fg px-1 align-middle font-mono text-[9.5px] leading-[14px] text-bg">
                      {seg.startsChunk + 1}
                    </span>
                  )}
                  {t}
                </span>
              );
            })}
          </div>
        </div>

        {/* retrieval */}
        <div>
          <PanelTitle n={4} meta="BM25 over these chunks">
            Retrieve
          </PanelTitle>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-bg/60 px-3 focus-within:border-accent/60">
            <Search className="size-4 text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about the document…"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-fg focus:outline-none"
              aria-label="Query"
            />
          </div>
          <ol className="mt-3 max-h-[400px] space-y-2 overflow-y-auto pr-1">
            {ranked.map(({ c, s }, rank) => (
              <li
                key={c.i}
                onMouseEnter={() => setHover(c.i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(c.i)}
                tabIndex={0}
                className={`cursor-default rounded-xl border p-3 transition-colors ${focus === c.i ? "border-accent/60 bg-accent/[0.06]" : "border-line bg-card"}`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded bg-fg px-1.5 font-mono text-[10px] leading-4 text-bg">{c.i + 1}</span>
                  {query.trim() && s > 0 && rank < 3 && <span className="font-mono text-[10px] text-accent">top {rank + 1}</span>}
                  <span className="ml-auto font-mono text-[10.5px] text-subtle tabular-nums">
                    {c.text.length} chars · score {s.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <div className="h-full rounded-full bg-series-1 transition-[width] duration-300" style={{ width: `${query.trim() ? (s / maxScore) * 100 : 0}%` }} />
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{c.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-5">
        <LabNote>
          Chunk size is a retrieval decision: too small and the answer gets split across chunks, too large and the right sentence is buried in noise. Change
          the size and watch which chunk ranks first.
        </LabNote>
      </div>
    </div>
  );
}

function Swatch({ c }: { c: string }) {
  return <span className="inline-block size-3 rounded-[3px]" style={{ backgroundColor: c }} />;
}
