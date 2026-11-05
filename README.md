# Alivelli Ashwanth · AI Engineer Portfolio

Personal portfolio for **Alivelli Ashwanth**, an AI Engineer building production GenAI: RAG systems, AI agents and LLM security.

Built with **React 19 + TypeScript + Vite + Tailwind CSS v4 + Motion**. It's a fully static site, so no server or API keys are needed.

## Highlights

| Feature | What it does |
| --- | --- |
| **Recruiter quick view** | A 30-second summary panel: key facts, strengths, proof of work, core stack, industries, resume download and a "Copy summary for ATS" button. Opens from the nav, the hero or ⌘K. Share `?recruiter` (e.g. `https://your-site/?recruiter`) to open it directly. |
| **JD fit check** | Recruiters paste a job description. A skill extractor running in the browser maps every requirement to evidence from the projects, flags transferable skills (e.g. Kubernetes via Docker) and honest gaps, checks years/degree/location, and gives a skill-match score with a one-click "Email Ashwanth about this role". |
| **AI Lab · guardrail playground** | Try to jailbreak a mini LLM gateway: live scanning for prompt injection, jailbreaks, system-prompt extraction, PII/secrets (with redaction), unsafe tool calls and base64-smuggled payloads, each mapped to the OWASP Top 10 for LLM Applications. |
| **AI Lab · Agent workbench** | A tool-using agent drawn as a LangGraph-style graph: guardrail → planner → tools (`search_portfolio`, `skill_lookup`, `fit_check`, `get_contact`) → synthesize. Nodes light up as it runs, with a full execution trace. The planner is rule-based; the tools are real. |
| **AI Lab · Chunking lab** | Recursive / sentence / fixed / paragraph chunking with size and overlap sliders, chunks highlighted in the document, and BM25 retrieval over the chunks to show how chunking changes what gets retrieved. |
| **AI Lab · Hallucination checker** | Paste a source and an answer: every claim is checked for coverage by one or two source sentences, and every number and name must appear in the source (acronyms like RAG match their expansion). Gives a faithfulness score with evidence links. |
| **AI Lab · Evals lab** | Drag a decision threshold over synthetic detector scores and watch precision, recall, F1 and false positives move, with a mirrored histogram, confusion matrix, PR curve and "max F1 / catch 95% / ≤1% FP" presets. |
| **AI Lab · Decoding lab** | Temperature, top-k and top-p applied to a next-token distribution (real softmax + nucleus math, illustrative logits), with sampling and entropy. |
| **AI Lab · Matchmaking engine** | Two-stage recommender modeled on Nudr: cosine retrieval → re-rank on distance and recency (adjustable weights) → likes/skips update a preference vector shown as a radar. Synthetic profiles. |
| **AI Lab · Live failure prediction** | Streaming sensor charts (10 Hz) with fault injection, rolling-window features, a failure-risk score and an event log, modeled on the CNC project. |
| **AI Lab · RAG under the hood** | Watch the assistant's pipeline run step by step: tokenize → query expansion → BM25 retrieval scores → confidence gate → grounded answer. |
| **Ask my AI** | A chatbot that answers questions about Ashwanth. It's a small **RAG system running in the browser**: tokenizer, stemming, synonym expansion, **Okapi BM25** retrieval, a `skill_lookup` tool, intent routing, source citations and a visible "How I answered" retrieval trace. Voice input where the browser supports it. No API calls. |
| **Live agent traces** | The hero terminal animates illustrative traces of the systems he builds: compliance RAG, an LLM security gateway, red-teaming and fine-tune evals. Brand logos of the daily stack sit underneath. |
| **Neural network canvas** | Interactive particle network that reaches toward the cursor. It pauses off-screen and respects `prefers-reduced-motion`. |
| **Case-study modals** | Each project opens with the problem, a step-by-step architecture diagram, what was built and the stack. Use ← → to move between projects. |
| **⌘K command palette** | Jump to sections or projects, download the resume, copy the email, switch theme, or ask the AI. Press `/` to open the assistant. |
| **Dark / light themes** | Follows the system setting, remembers your choice, and avoids a flash of the wrong theme on load. |
| **SEO-ready** | Meta and Open Graph tags, a social preview image, JSON-LD `Person` schema, and a `<noscript>` fallback. |
| **Accessible & responsive** | Keyboard support, focus rings, ARIA labels, skip link, reduced motion, and tested at phone, tablet and desktop widths. |

## Edit the content

**All content lives in one file: [`src/data/portfolio.ts`](src/data/portfolio.ts).**
It holds the profile, stats, experience, projects (with their architecture steps), skills, education and achievements.
The page and the AI assistant's knowledge base are both built from it, so you only edit content in one place.

- Replace `public/Alivelli_Ashwanth_Resume.pdf` to update the downloadable resume (keep the filename, or change `profile.resume`).
- Add a project: append an object to `projects` and it appears in the grid, the modal, the command palette and the assistant.
- To tune the assistant's answers, edit `src/lib/assistant.ts`: `buildKnowledgeBase()` holds the answers and `SYNONYMS` holds query expansion.
- The recruiter panel reads `recruiter` in `portfolio.ts`. The fit check's skill list (including skills you *don't* have, so gaps are honest) lives in `src/lib/fit.ts`. When you learn a new skill, move it from `GAPS` to `HAVE` and list the projects that prove it.

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build
```

## Deploy

The build uses relative asset paths (`base: "./"`), so the same `dist/` works on any host.

### GitHub Pages (included)
1. Push to `main`.
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. `.github/workflows/deploy.yml` builds and deploys on every push to `main`.

### Vercel / Netlify
Import the repo. Build command: `npm run build`. Output directory: `dist`.

### Custom domain
Add a `public/CNAME` file containing your domain (for GitHub Pages), or set the domain in Vercel/Netlify.
Then change the `og:image` / `twitter:image` URLs in `index.html` to absolute URLs (e.g. `https://your-domain.com/og-image.png`), because some social networks require absolute image URLs.

## Optional features

The contact form works out of the box. The rest is switched on by a setting. Locally, put the values in `.env.local` (see `.env.example`). For GitHub Pages, add them as **repository variables** (Settings → Secrets and variables → Actions → Variables), named without the `VITE_` prefix. Anything you leave unset stays off, and the site keeps working.

| Feature | Variable(s) | What you need |
| --- | --- | --- |
| Custom domain, absolute social-preview URLs, canonical link, `sitemap.xml`, `rss.xml`, `CNAME` | `SITE_URL` (e.g. `https://ashwanth.dev`) | A domain. For GitHub Pages, point DNS at GitHub (a `CNAME` record to `ashwanth2308.github.io`, or GitHub's A records for an apex domain), then add the domain under Settings → Pages. |
| Privacy-friendly analytics | `ANALYTICS` (`plausible`, `umami` or `goatcounter`) + `ANALYTICS_ID` | An account with that service. Events tracked: `recruiter_view_open`, `fit_check`, `lab_open`, `resume_download`, `chat_question`, `contact_submit`. |
| Contact form | Already on: it posts to Formspree (`profile.formEndpoint` in `src/data/portfolio.ts`). `FORM_ENDPOINT` overrides it. | Nothing. Formspree emails each message to the form's owner. Includes a spam honeypot, and success and error states. |

### Writing (blog)

Add Markdown files to `content/blog/`:

```md
---
title: Building a prompt-injection gateway
date: 2026-11-20
summary: One sentence shown on cards and in search results.
tags: [LLM security, OWASP]
draft: false
---
Your post…
```

Each post becomes a static page at `/blog/<file-name>/` with its own social preview. Posts also appear in the Writing section on the home page, in `rss.xml` and in `sitemap.xml` (the last two need `SITE_URL`). Posts with `draft: true` show only in `npm run dev`. Two draft outlines are included with TODOs for your own numbers.

### Case studies

Each project in `src/data/portfolio.ts` can have `decisions`, `results` and `lessons`. They appear in the project pop-up under **Key decisions**, **Results** and **What I'd do differently**. The current text comes only from the resume. Add real numbers to `results`, and write `lessons` yourself; that section stays hidden while it's empty.

### Performance

Lighthouse on the production build, on a simulated mid-range phone:
- Performance: 92–96 (it varies from run to run)
- Accessibility: 100
- Best practices: 100
- SEO: 100

Desktop scores 100 in all four. Sections below the first screen and the pop-ups mount one at a time while the browser is idle. Each AI Lab playground loads its code only when opened. The background canvas starts after load, and runs lighter on touch devices.

## Project structure

```
src/
  data/portfolio.ts        ← all site content
  data/logos.ts            ← brand marks (Simple Icons, CC0) for the logo strips
  lib/assistant.ts         ← in-browser RAG: knowledge base, BM25, tools, intents, explain()
  lib/fit.ts               ← JD fit analyzer: skill taxonomy, evidence, scoring
  lib/guardrail.ts         ← mini LLM gateway: detectors, OWASP mapping, redaction
  lib/agent.ts             ← graph agent: planner + tools built on the engines above
  lib/chunk.ts             ← chunking strategies + BM25 over chunks
  lib/analytics.ts         ← opt-in analytics events
  lib/grounding.ts         ← claim-level grounding / hallucination check
  components/
    Hero.tsx               ← typewriter, CTAs, agent-trace terminal
    AgentTrace.tsx         ← animated LLM pipeline traces
    NeuralBackground.tsx   ← interactive canvas network
    About.tsx              ← stats counters, summary, code card, focus areas
    Experience.tsx         ← timeline with expandable project rows
    Projects.tsx           ← filterable project grid
    AILab.tsx              ← lab launcher (9 playgrounds, lazy-loaded; deep links via #lab/<id>)
    lab/*.tsx              ← AgentLab, GuardrailLab, GroundingLab, RagLab, ChunkLab, DecodeLab, EvalLab, RecsysLab, StreamLab
    FitCheck.tsx           ← paste-a-JD fit report
    RecruiterView.tsx      ← 30-second recruiter panel
    ProjectModal.tsx       ← case study + architecture diagram
    Skills.tsx             ← skill groups + marquee
    Education.tsx          ← degree + certifications
    Contact.tsx            ← contact links, mailto form, footer
    AskAI.tsx              ← chat assistant UI
    CommandPalette.tsx     ← ⌘K palette
    Navbar.tsx, ui.tsx
    Writing.tsx            ← blog posts on the home page
content/blog/              ← Markdown posts (static pages generated at build)
plugins/site.ts            ← build plugin: SEO URLs, sitemap, RSS, CNAME, analytics, blog pages
public/                    ← resume PDF, favicon, OG image
```

## Privacy note

The phone number is deliberately **not** shown on the page, to cut down on scraping and spam. It is still in the downloadable resume PDF. To show it on the page, render `profile.phone` in `Contact.tsx`.
