# Alivelli Ashwanth · AI Engineer Portfolio

Personal portfolio for **Alivelli Ashwanth**, an AI Engineer building production GenAI: RAG systems, AI agents and LLM security.

Built with **React 19 + TypeScript + Vite + Tailwind CSS v4 + Motion**. It's a fully static site, so no server or API keys are needed.

## Highlights

| Feature | What it does |
| --- | --- |
| **Recruiter quick view** | A 30-second summary panel: key facts, strengths, proof of work, core stack, industries, resume download and a "Copy summary for ATS" button. Opens from the nav, the hero or ⌘K. Share `?recruiter` (e.g. `https://your-site/?recruiter`) to open it directly. |
| **JD fit check** | Recruiters paste a job description. A skill extractor running in the browser maps every requirement to evidence from the projects, flags transferable skills (e.g. Kubernetes via Docker) and honest gaps, checks years/degree/location, and gives a skill-match score with a one-click "Email Ashwanth about this role". |
| **AI Lab · guardrail playground** | Try to jailbreak a mini LLM gateway: live scanning for prompt injection, jailbreaks, system-prompt extraction, PII/secrets (with redaction), unsafe tool calls and base64-smuggled payloads, each mapped to the OWASP Top 10 for LLM Applications. |
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

## Project structure

```
src/
  data/portfolio.ts        ← all site content
  data/logos.ts            ← brand marks (Simple Icons, CC0) for the logo strips
  lib/assistant.ts         ← in-browser RAG: knowledge base, BM25, tools, intents, explain()
  lib/fit.ts               ← JD fit analyzer: skill taxonomy, evidence, scoring
  lib/guardrail.ts         ← mini LLM gateway: detectors, OWASP mapping, redaction
  components/
    Hero.tsx               ← typewriter, CTAs, agent-trace terminal
    AgentTrace.tsx         ← animated LLM pipeline traces
    NeuralBackground.tsx   ← interactive canvas network
    About.tsx              ← stats counters, summary, code card, focus areas
    Experience.tsx         ← timeline with expandable project rows
    Projects.tsx           ← filterable project grid
    AILab.tsx              ← guardrail playground + RAG pipeline inspector
    FitCheck.tsx           ← paste-a-JD fit report
    RecruiterView.tsx      ← 30-second recruiter panel
    ProjectModal.tsx       ← case study + architecture diagram
    Skills.tsx             ← skill groups + marquee
    Education.tsx          ← degree + certifications
    Contact.tsx            ← contact links, mailto form, footer
    AskAI.tsx              ← chat assistant UI
    CommandPalette.tsx     ← ⌘K palette
    Navbar.tsx, ui.tsx
public/                    ← resume PDF, favicon, OG image, robots.txt
```

## Privacy note

The phone number is deliberately **not** shown on the page, to cut down on scraping and spam. It is still in the downloadable resume PDF. To show it on the page, render `profile.phone` in `Contact.tsx`.
