/**
 * Build-time site plugin.
 *
 *  • VITE_SITE_URL        → canonical URL, absolute social-preview URLs, sitemap.xml, RSS, CNAME
 *  • VITE_ANALYTICS(+_ID) → injects a privacy-friendly analytics script (Plausible, Umami or GoatCounter)
 *  • content/blog/*.md    → static pages at blog/<slug>/, a blog index, rss.xml, and the
 *                           `virtual:blog-posts` module used by the Writing section
 *
 * Every feature is off unless configured, so the site builds and runs with zero setup.
 */
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { loadEnv, type Plugin, type ResolvedConfig } from "vite";

type Post = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  draft: boolean;
  readingTime: number;
  html: string;
};

const AUTHOR = "Alivelli Ashwanth";
const VIRTUAL = "virtual:blog-posts";
const RESOLVED = "\0" + VIRTUAL;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function parseFrontmatter(src: string) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const data: Record<string, string | boolean | string[]> = {};
  if (m)
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (!kv) continue;
      const raw = kv[2].trim();
      data[kv[1]] = /^\[.*\]$/.test(raw)
        ? raw
            .slice(1, -1)
            .split(",")
            .map((x) => x.trim().replace(/^["']|["']$/g, ""))
            .filter(Boolean)
        : raw === "true" || raw === "false"
          ? raw === "true"
          : raw.replace(/^["']|["']$/g, "");
    }
  return { data, body: m ? src.slice(m[0].length) : src };
}

function loadPosts(root: string, includeDrafts: boolean): Post[] {
  const dir = path.join(root, "content", "blog");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { data, body } = parseFrontmatter(fs.readFileSync(path.join(dir, f), "utf8"));
      const words = body.split(/\s+/).filter(Boolean).length;
      return {
        slug: String(data.slug ?? f.replace(/\.md$/, "")),
        title: String(data.title ?? f),
        date: String(data.date ?? ""),
        summary: String(data.summary ?? ""),
        tags: Array.isArray(data.tags) ? data.tags : [],
        draft: data.draft === true,
        readingTime: Math.max(1, Math.round(words / 220)),
        html: marked.parse(body, { async: false }) as string,
      };
    })
    .filter((p) => includeDrafts || !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Pull the colour tokens out of src/index.css so blog pages match the site in both themes. */
function themeTokens(root: string) {
  const css = fs.readFileSync(path.join(root, "src", "index.css"), "utf8");
  const dark = css.match(/:root\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  const light = css.match(/:root\.light\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  return `${dark}\n${light}`;
}

const fmtDate = (d: string) => {
  const t = Date.parse(d);
  return Number.isNaN(t) ? d : new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const PAGE_CSS = `
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.7 "Inter Variable","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
  a{color:var(--accent)}
  .bar{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px max(20px,env(safe-area-inset-left,0px));border-bottom:1px solid var(--line);background:color-mix(in oklab,var(--bg-elev) 85%,transparent);backdrop-filter:blur(12px)}
  .bar a{color:var(--fg);text-decoration:none;font-weight:600}
  .bar nav{display:flex;gap:14px;align-items:center;font-size:14px}
  .bar nav a{color:var(--muted);font-weight:500}
  .bar button{font:inherit;font-size:13px;color:var(--muted);background:var(--card);border:1px solid var(--line);border-radius:8px;padding:5px 10px;cursor:pointer}
  main{max-width:720px;margin:0 auto;padding:56px max(20px,env(safe-area-inset-left,0px)) 80px}
  .meta{font:12px/1.4 "JetBrains Mono Variable","JetBrains Mono",ui-monospace,monospace;color:var(--subtle);letter-spacing:.04em;text-transform:uppercase;margin:0 0 14px}
  h1{font-family:"Space Grotesk Variable","Space Grotesk","Inter Variable",sans-serif;font-size:clamp(2rem,5vw,2.9rem);line-height:1.1;letter-spacing:-.02em;margin:0 0 16px;text-wrap:balance}
  .lede{font-size:1.15rem;color:var(--muted);margin:0 0 40px}
  .tags{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 36px;padding:0;list-style:none}
  .tags li{font:11px/1 "JetBrains Mono Variable",ui-monospace,monospace;border:1px solid var(--line);border-radius:999px;padding:6px 10px;color:var(--muted)}
  .draft{display:inline-block;margin-left:8px;color:var(--warn)}
  .prose h2{font-family:"Space Grotesk Variable","Space Grotesk",sans-serif;font-size:1.55rem;line-height:1.25;margin:2.2em 0 .6em;text-wrap:balance}
  .prose h3{font-size:1.15rem;margin:1.8em 0 .5em}
  .prose p,.prose ul,.prose ol{margin:0 0 1.15em}
  .prose ul,.prose ol{padding-left:1.3em}
  .prose ul{list-style:disc}.prose ol{list-style:decimal}
  .prose li{margin:.3em 0}
  .prose strong{color:var(--fg)}
  .prose blockquote{margin:1.5em 0;padding:.2em 1.1em;border-left:3px solid var(--accent);color:var(--muted)}
  .prose code{font:.88em "JetBrains Mono Variable","JetBrains Mono",ui-monospace,monospace;background:var(--card);border:1px solid var(--line);border-radius:6px;padding:.12em .4em}
  .prose pre{overflow-x:auto;background:var(--bg-elev);border:1px solid var(--line);border-radius:14px;padding:16px 18px;line-height:1.55}
  .prose pre code{border:0;background:none;padding:0;font-size:13.5px}
  .prose hr{border:0;border-top:1px solid var(--line);margin:2.5em 0}
  .prose table{border-collapse:collapse;width:100%;font-size:15px;display:block;overflow-x:auto}
  .prose th,.prose td{border-bottom:1px solid var(--line);padding:8px 10px;text-align:left}
  .list{display:grid;gap:14px;padding:0;margin:0;list-style:none}
  .list a{display:block;text-decoration:none;color:inherit;border:1px solid var(--line);background:var(--card);border-radius:16px;padding:20px 22px}
  .list a:hover{border-color:var(--line-strong)}
  .list h2{font-family:"Space Grotesk Variable","Space Grotesk",sans-serif;font-size:1.3rem;margin:0 0 6px;color:var(--fg)}
  .list p{margin:0;color:var(--muted);font-size:15.5px}
  footer{margin-top:64px;padding-top:24px;border-top:1px solid var(--line);font-size:15px;color:var(--muted)}
  :focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:6px}
`;

const THEME_JS = `try{var t=localStorage.getItem("theme");if(t==="light"||(!t&&matchMedia("(prefers-color-scheme: light)").matches))document.documentElement.classList.add("light")}catch(e){}`;
const TOGGLE_JS = `document.getElementById("theme").addEventListener("click",function(){var l=document.documentElement.classList.toggle("light");try{localStorage.setItem("theme",l?"light":"dark")}catch(e){}});`;

function analyticsTags(env: Record<string, string>) {
  const p = env.VITE_ANALYTICS;
  const id = env.VITE_ANALYTICS_ID;
  if (!p || !id) return "";
  if (p === "plausible")
    return `<script defer data-domain="${esc(id)}" src="${esc(env.VITE_ANALYTICS_SRC || "https://plausible.io/js/script.js")}"></script>
<script>window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}</script>`;
  if (p === "umami") return `<script defer src="${esc(env.VITE_ANALYTICS_SRC || "https://cloud.umami.is/script.js")}" data-website-id="${esc(id)}"></script>`;
  if (p === "goatcounter") return `<script data-goatcounter="https://${esc(id)}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`;
  return "";
}

function page(opts: { title: string; description: string; body: string; depth: number; css?: string; site: string; canonical: string; tokens: string; head: string }) {
  const up = "../".repeat(opts.depth);
  const abs = opts.site ? `${opts.site}${opts.canonical}` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
<meta name="author" content="${AUTHOR}">
${abs ? `<link rel="canonical" href="${esc(abs)}">\n<meta property="og:url" content="${esc(abs)}">` : ""}
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(opts.title)}">
<meta property="og:description" content="${esc(opts.description)}">
<meta property="og:image" content="${opts.site ? `${opts.site}/og-image.png` : `${up}og-image.png`}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="${up}favicon.svg">
${opts.site ? `<link rel="alternate" type="application/rss+xml" title="${AUTHOR} — Writing" href="${opts.site}/rss.xml">` : ""}
${opts.css ? `<link rel="stylesheet" href="${up}${opts.css}">` : ""}
<style>${opts.tokens}${PAGE_CSS}</style>
<script>${THEME_JS}</script>
${opts.head}
</head>
<body>
<header class="bar"><a href="${up}">← ${AUTHOR}</a><nav><a href="${up}blog/">All writing</a><a href="${up}#contact">Contact</a><button id="theme" type="button" aria-label="Toggle light and dark theme">Theme</button></nav></header>
<main>
${opts.body}
<footer>Written by ${AUTHOR}, AI Engineer in Hyderabad. <a href="${up}">See the portfolio</a> or <a href="${up}#contact">get in touch</a>.</footer>
</main>
<script>${TOGGLE_JS}</script>
</body>
</html>`;
}

const postBody = (p: Post) => `<p class="meta">${esc(fmtDate(p.date))} · ${p.readingTime} min read${p.draft ? '<span class="draft">· draft</span>' : ""}</p>
<h1>${esc(p.title)}</h1>
<p class="lede">${esc(p.summary)}</p>
${p.tags.length ? `<ul class="tags">${p.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
<article class="prose">${p.html}</article>`;

const indexBody = (posts: Post[]) => `<p class="meta">Writing</p>
<h1>Notes on building AI systems</h1>
<p class="lede">RAG, agents, LLM security and evaluation, from production work.</p>
<ul class="list">${posts
  .map(
    (p) =>
      `<li><a href="./${p.slug}/"><p class="meta">${esc(fmtDate(p.date))} · ${p.readingTime} min read${p.draft ? " · draft" : ""}</p><h2>${esc(p.title)}</h2><p>${esc(p.summary)}</p></a></li>`,
  )
  .join("")}</ul>`;

export default function site(): Plugin {
  let config: ResolvedConfig;
  let env: Record<string, string> = {};
  let site = "";
  let isBuild = false;

  return {
    name: "portfolio-site",
    configResolved(c) {
      config = c;
      isBuild = c.command === "build";
      env = loadEnv(c.mode, c.root, "");
      site = (env.VITE_SITE_URL || "").trim().replace(/\/+$/, "");
    },

    resolveId(id) {
      return id === VIRTUAL ? RESOLVED : null;
    },
    load(id) {
      if (id !== RESOLVED) return null;
      const posts = loadPosts(config.root, !isBuild).map(({ html: _html, ...meta }) => meta);
      return `export const posts = ${JSON.stringify(posts)};`;
    },

    transformIndexHtml(html) {
      let out = html;
      if (site) {
        out = out
          .replace(/content="\.\/og-image\.png"/g, `content="${site}/og-image.png"`)
          .replace('<meta property="og:type" content="website" />', `<meta property="og:type" content="website" />\n    <meta property="og:url" content="${site}/" />\n    <link rel="canonical" href="${site}/" />`);
        out = out.replace("</head>", `    <link rel="alternate" type="application/rss+xml" title="${AUTHOR} — Writing" href="${site}/rss.xml" />\n  </head>`);
      }
      const tags = analyticsTags(env);
      if (tags) out = out.replace("</head>", `    ${tags}\n  </head>`);
      return out;
    },

    configureServer(server) {
      // Serve blog pages in dev (drafts included, marked as drafts).
      server.middlewares.use((req, res, next) => {
        const m = req.url?.match(/^\/blog\/(?:([\w-]+)\/?)?(?:index\.html)?(?:\?.*)?$/);
        if (!m) return next();
        const posts = loadPosts(config.root, true);
        const tokens = themeTokens(config.root);
        const html = m[1]
          ? (() => {
              const p = posts.find((x) => x.slug === m[1]);
              return p ? page({ title: `${p.title} · ${AUTHOR}`, description: p.summary, body: postBody(p), depth: 2, site: "", canonical: "", tokens, head: "" }) : null;
            })()
          : page({ title: `Writing · ${AUTHOR}`, description: "Notes on building AI systems.", body: indexBody(posts), depth: 1, site: "", canonical: "", tokens, head: "" });
        if (!html) return next();
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(html);
      });
    },

    generateBundle(_opts, bundle) {
      const css = Object.values(bundle).find((f) => f.type === "asset" && f.fileName.startsWith("assets/index-") && f.fileName.endsWith(".css"))?.fileName;
      const posts = loadPosts(config.root, false);
      const tokens = themeTokens(config.root);
      const head = analyticsTags(env);
      const emit = (fileName: string, source: string) => this.emitFile({ type: "asset", fileName, source });

      if (posts.length) {
        emit("blog/index.html", page({ title: `Writing · ${AUTHOR}`, description: "Notes on building AI systems: RAG, agents, LLM security and evaluation.", body: indexBody(posts), depth: 1, css, site, canonical: "/blog/", tokens, head }));
        for (const p of posts)
          emit(`blog/${p.slug}/index.html`, page({ title: `${p.title} · ${AUTHOR}`, description: p.summary, body: postBody(p), depth: 2, css, site, canonical: `/blog/${p.slug}/`, tokens, head }));
      }

      emit("robots.txt", `User-agent: *\nAllow: /\n${site ? `Sitemap: ${site}/sitemap.xml\n` : ""}`);

      if (site) {
        const urls = ["/", ...(posts.length ? ["/blog/", ...posts.map((p) => `/blog/${p.slug}/`)] : [])];
        emit(
          "sitemap.xml",
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
            .map((u) => `  <url><loc>${esc(site + u)}</loc></url>`)
            .join("\n")}\n</urlset>\n`,
        );
        if (posts.length)
          emit(
            "rss.xml",
            `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${AUTHOR} — Writing</title><link>${esc(site)}/blog/</link><description>Notes on building AI systems.</description>\n${posts
              .map(
                (p) =>
                  `<item><title>${esc(p.title)}</title><link>${esc(`${site}/blog/${p.slug}/`)}</link><guid>${esc(`${site}/blog/${p.slug}/`)}</guid>${
                    Number.isNaN(Date.parse(p.date)) ? "" : `<pubDate>${new Date(p.date).toUTCString()}</pubDate>`
                  }<description>${esc(p.summary)}</description></item>`,
              )
              .join("\n")}\n</channel></rss>\n`,
          );
        const host = new URL(site).hostname;
        if (!host.endsWith("github.io") && !host.endsWith("vercel.app") && !host.endsWith("netlify.app") && !host.endsWith("pages.dev")) emit("CNAME", `${host}\n`);
      }
    },
  };
}
