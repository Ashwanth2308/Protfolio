/**
 * A tiny Retrieval-Augmented assistant that runs entirely in the browser.
 *
 *  1. A knowledge base of "chunks" is built from src/data/portfolio.ts.
 *  2. Questions are tokenized, lightly stemmed and expanded with synonyms.
 *  3. Chunks are scored with Okapi BM25 (+ a title/keyword boost).
 *  4. The best chunk's grounded answer is returned with its sources and a
 *     retrieval trace, so visitors can see *how* it answered.
 *
 * No API keys, no network calls — it works on any static host.
 */
import {
  achievements,
  education,
  experience,
  profile,
  projects,
  skills,
} from "../data/portfolio";

export type Chunk = {
  id: string;
  title: string;
  section: string; // anchor id on the page
  keywords: string;
  text: string; // what retrieval indexes
  answer: string; // grounded answer returned to the visitor
  followUps?: string[];
};

export type Retrieved = { chunk: Chunk; score: number };

export type AssistantReply = {
  answer: string;
  sources: Retrieved[];
  followUps: string[];
  trace: { tokens: string[]; ms: number; candidates: number; method: string };
};

const list = (items: string[]) =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/* ───────────────────────── Knowledge base ───────────────────────── */

function buildKnowledgeBase(): Chunk[] {
  const chunks: Chunk[] = [];
  const genai = skills[0].items;
  const frameworks = skills[1].items;
  const vectors = skills[2].items;
  const ml = skills[3].items;
  const prog = skills[4].items;
  const ops = skills[5].items;

  chunks.push({
    id: "intro",
    title: "Who is Ashwanth?",
    section: "about",
    keywords:
      "who are you introduce yourself about summary overview background tell me ashwanth alivelli profile bio",
    text: profile.summary.join(" "),
    answer: `${profile.name} is an ${profile.role} based in ${profile.location}, currently an Associate AI Engineer at ${profile.company}. He has 1.5+ years of experience designing, building and deploying production Generative AI for cybersecurity and regulated insurance workflows — RAG systems, AI agents and compliance-aware LLM pipelines with Python, LangChain, LangGraph and FastAPI. He brings a security-first approach: prompt-injection defense, guardrails, automated red-teaming and LLM evaluation.`,
    followUps: ["What is he working on now?", "What's his tech stack?", "Show me his best project"],
  });

  chunks.push({
    id: "current",
    title: "Current role",
    section: "experience",
    keywords:
      "current job role position company work now present today employer cygne noir cyber associate where does he work",
    text: `${experience[0].role} at ${experience[0].company} ${experience[0].period}. ${experience[0].summary} ${experience[0].projects.map((p) => p.name).join(" ")}`,
    answer: `He's an ${experience[0].role} at ${experience[0].company} (${experience[0].period}), working on:\n\n${experience[0].projects
      .map((p) => `• **${p.name}**${p.context ? ` (${p.context})` : ""}`)
      .join("\n")}\n\nBefore that he was an ${experience[1].role} at the same company (${experience[1].period}).`,
    followUps: ["Tell me about the insurance RAG project", "What is the LLM security gateway?"],
  });

  chunks.push({
    id: "trainee",
    title: "AI Engineer Trainee",
    section: "experience",
    keywords: "trainee intern internship first role early career started beginning junior 2025",
    text: `${experience[1].role} ${experience[1].company} ${experience[1].period} ${experience[1].summary} ${experience[1].projects
      .map((p) => `${p.name} ${p.points.join(" ")}`)
      .join(" ")}`,
    answer: `As an ${experience[1].role} at ${experience[1].company} (${experience[1].period}) he built:\n\n${experience[1].projects
      .map((p) => `• **${p.name}**: ${p.points[0]}`)
      .join("\n")}`,
    followUps: ["What is he working on now?", "Tell me about the internal RAG chatbot"],
  });

  chunks.push({
    id: "experience-years",
    title: "Experience",
    section: "experience",
    keywords:
      "experience years how long career history timeline worked jobs roles",
    text: experience.map((e) => `${e.role} ${e.company} ${e.period} ${e.summary}`).join(" "),
    answer: `He has 1.5+ years of hands-on AI engineering experience at ${profile.company}. He started as an ${experience[1].role} (${experience[1].period}) and moved up to ${experience[0].role} (${experience[0].period}). Across his roles and personal work he has built 10 AI & ML systems spanning RAG, agents, recommendation, LLM security and fine-tuning.`,
    followUps: ["What did he build as a trainee?", "List his projects"],
  });

  for (const p of projects) {
    const exp = experience.flatMap((e) => e.projects).find((x) => x.projectId === p.id);
    chunks.push({
      id: `project-${p.id}`,
      title: p.title,
      section: "projects",
      keywords: `${p.title} ${p.title} ${p.tagline} ${p.stack.join(" ")} ${p.id.replace(/-/g, " ")}`,
      text: [p.problem, ...p.highlights, ...(exp?.points ?? []), p.pipeline.map((s) => `${s.label} ${s.detail}`).join(" ")].join(" "),
      answer: `**${p.title}**: ${p.tagline}.\n\n${p.highlights
        .slice(0, 3)
        .map((h) => `• ${h}`)
        .join("\n")}\n\n**Stack:** ${p.stack.join(", ")}.`,
      followUps: ["What other projects has he built?", "What's his tech stack?"],
    });
  }

  chunks.push({
    id: "projects-overview",
    title: "All projects",
    section: "projects",
    keywords:
      "projects portfolio list all work built showcase best favorite flagship featured examples case studies",
    text: projects.map((p) => `${p.title} ${p.tagline}`).join(" "),
    answer: `He has built 10 AI & ML systems. Highlights:\n\n${projects
      .filter((p) => p.featured)
      .map((p) => `• **${p.title}**: ${p.tagline}`)
      .join("\n")}\n\nAsk me about any of them for details.`,
    followUps: ["Tell me about the security gateway", "Tell me about the fine-tuned LLM", "Explain the Nudr recommender"],
  });

  chunks.push({
    id: "skills-overview",
    title: "Tech stack",
    section: "skills",
    keywords:
      "skills tech stack technologies tools languages frameworks expertise proficient toolkit",
    text: skills.map((s) => `${s.group} ${s.items.join(" ")}`).join(" "),
    answer: `Core stack: Python, LangChain, LangGraph and FastAPI, with vector search on FAISS, ChromaDB, Pinecone and MongoDB Atlas. He works with the OpenAI, Google Gemini and Anthropic Claude APIs, fine-tunes open models with Hugging Face Transformers, PEFT (LoRA/QLoRA) and serves them with vLLM. ML: ${list(
      ml.slice(0, 4),
    )}. Ops: ${list(ops.slice(3))}.`,
    followUps: ["Which vector databases does he use?", "Does he know LangGraph?", "Has he fine-tuned models?"],
  });

  chunks.push({
    id: "skills-genai",
    title: "Generative AI skills",
    section: "skills",
    keywords:
      "generative ai genai llm large language models agents agentic multi agent prompt engineering function calling tool mcp model context protocol structured outputs guardrails hallucination",
    text: genai.join(" "),
    answer: `Generative AI is his core: ${list(genai)}.`,
    followUps: ["Does he build AI agents?", "How does he handle hallucinations?"],
  });

  chunks.push({
    id: "skills-frameworks",
    title: "LLM frameworks & APIs",
    section: "skills",
    keywords:
      "langchain langgraph llamaindex hugging face transformers peft vllm ollama langsmith openai gemini claude anthropic api frameworks providers models",
    text: frameworks.join(" "),
    answer: `Frameworks & APIs he works with: ${list(frameworks)}. In production he has shipped on Google Gemini (insurance RAG) and built OpenAI-compatible services (security gateway); his LangGraph work includes an automated red-teaming agent.`,
    followUps: ["Tell me about the red-teaming agent", "What's the insurance RAG project?"],
  });

  chunks.push({
    id: "skills-vector",
    title: "Vector databases & retrieval",
    section: "skills",
    keywords:
      "vector database db store faiss chroma chromadb pinecone mongodb atlas embeddings semantic search hybrid bm25 rerank reranking retrieval",
    text: vectors.join(" "),
    answer: `Retrieval toolkit: ${list(vectors)}. Examples: MongoDB for the California rate-filing RAG system, Pinecone for two-stage candidate retrieval in the Nudr recommender, and a full parse → chunk → embed → search pipeline for the internal RAG chatbot. (This assistant itself uses BM25!)`,
    followUps: ["Explain the Nudr recommender", "Tell me about the internal RAG chatbot"],
  });

  chunks.push({
    id: "skills-ml",
    title: "Machine learning",
    section: "skills",
    keywords:
      "machine learning ml deep learning pytorch scikit sklearn xgboost nlp recommendation pandas numpy data science classical",
    text: ml.join(" "),
    answer: `Beyond LLMs he has solid classical and deep-learning foundations: ${list(ml)}. His degree is in CSE (Data Science), and his CNC failure-prediction project hit 95% accuracy with XGBoost on live sensor data.`,
    followUps: ["Tell me about the CNC project", "What's his education?"],
  });

  chunks.push({
    id: "skills-prog",
    title: "Programming, backend & cloud",
    section: "skills",
    keywords:
      "programming languages python java sql database postgres postgresql mysql redis mongodb backend fastapi rest api pydantic docker git github actions ci cd aws cloud linux devops mlops deploy",
    text: [...prog, ...ops].join(" "),
    answer: `Languages & databases: ${list(prog)}. Backend, MLOps & cloud: ${list(ops)}. For example, the LLM security gateway shipped as a Dockerized FastAPI service with an OpenAI-compatible API.`,
    followUps: ["Tell me about the security gateway", "Does he know AWS?"],
  });

  chunks.push({
    id: "security",
    title: "Security-first AI",
    section: "projects",
    keywords:
      "security cybersecurity secure prompt injection jailbreak red team red-teaming guardrails owasp pii safety attack defense mitre att&ck threat siem",
    text: "prompt injection defense guardrails automated red-teaming OWASP Top 10 LLM PII leakage jailbreaks MITRE ATT&CK SIEM threat intelligence incident response",
    answer: `Security is his differentiator. He built an LLM Agent Security Gateway that detects prompt injection, jailbreaks, PII leakage and unsafe tool calls in real time, plus a LangGraph red-teaming agent that attacks it using the OWASP Top 10 for LLMs — benchmarking attack success rate, false positives and latency. He has also worked on IRIS (AI incident response), Echosim (MITRE ATT&CK adversary emulation), synthetic SIEM logs and LLM threat-intel tools.`,
    followUps: ["Tell me about the security gateway", "What is Echosim?", "What is IRIS?"],
  });

  chunks.push({
    id: "finetuning",
    title: "Fine-tuning & evaluation",
    section: "projects",
    keywords:
      "fine tune fine-tuning finetune lora qlora peft train training open source model 7b vllm evaluation eval benchmark harness",
    text: "QLoRA 7B Hugging Face PEFT Sigma detection rules execution based evaluation harness vLLM",
    answer: `Yes — he fine-tuned an open-source 7B LLM with QLoRA (Transformers + PEFT) to generate Sigma detection rules from attack descriptions. He built an execution-based eval harness that runs generated rules against held-out attack and benign logs to measure detection rate and false positives, compared it with a frontier API model on accuracy, cost and latency, and served it with vLLM behind FastAPI.`,
    followUps: ["What other security work has he done?", "What's his tech stack?"],
  });

  chunks.push({
    id: "agents",
    title: "AI agents",
    section: "projects",
    keywords: "agent agents agentic langgraph multi-agent autonomous tool calling workflow graph orchestration",
    text: "LangGraph red-teaming agent multi-agent tool calling MCP structured outputs",
    answer: `He builds AI agents with LangGraph and LangChain — tool/function calling, Model Context Protocol (MCP), structured outputs and multi-agent systems. A standout is his automated red-teaming agent in LangGraph that generates direct and indirect prompt-injection attacks against LLM agents, and the guardrail gateway that inspects agents' tool calls in real time.`,
    followUps: ["Tell me about the security gateway", "Does he use MCP?"],
  });

  chunks.push({
    id: "hallucination",
    title: "Grounding & hallucination",
    section: "projects",
    keywords: "hallucination hallucinations grounded grounding citations cite accuracy reliable trustworthy factual",
    text: "source cited responses grounded answers regulatory authority hierarchy compliance guardrails cite governing regulation",
    answer: `He keeps LLMs grounded through retrieval tuning, prompt design and guardrails — and by making the model cite its sources. His internal RAG chatbot returns source-cited answers, and the insurance rate-filing system uses a regulatory authority hierarchy plus compliance guardrails so every output cites the governing regulation.`,
    followUps: ["Tell me about the insurance RAG project", "Tell me about the internal RAG chatbot"],
  });

  chunks.push({
    id: "education",
    title: "Education",
    section: "education",
    keywords: "education degree college university school btech b.tech study studied graduate cgpa gpa mlr institute",
    text: `${education.degree} ${education.school} ${education.location} ${education.period} ${education.grade}`,
    answer: `${education.degree} from ${education.school}, ${education.location} (${education.period}) with a ${education.grade}. His final-year project was a real-time CNC machine failure predictor that reached 95% accuracy.`,
    followUps: ["Tell me about the CNC project", "Any certifications?"],
  });

  chunks.push({
    id: "achievements",
    title: "Certifications & achievements",
    section: "education",
    keywords:
      "certifications certificates certified achievements awards hackerrank codevita tcs nptel ibm smart interviews dsa competitive coding badges",
    text: achievements.map((a) => `${a.title} ${a.detail} ${a.year ?? ""}`).join(" "),
    answer: `Certifications & achievements:\n\n${achievements
      .map((a) => `• **${a.title}**: ${a.detail}${a.year ? ` (${a.year})` : ""}`)
      .join("\n")}`,
    followUps: ["What's his education?", "What's his tech stack?"],
  });

  chunks.push({
    id: "contact",
    title: "Contact",
    section: "contact",
    keywords:
      "contact email reach hire hiring open available availability opportunity opportunities freelance collaborate connect linkedin github message talk call resume cv interview recruit recruiter",
    text: `${profile.email} ${profile.socials.linkedin} ${profile.socials.github}`,
    answer: `The best way to reach him is email: ${profile.email}. You can also connect on LinkedIn or browse his code on GitHub (links in the Contact section), or download his resume from the top of the page. He's always happy to talk about AI engineering, RAG, agents and LLM security.`,
    followUps: ["Who is Ashwanth?", "Show me his best project"],
  });

  chunks.push({
    id: "location",
    title: "Location",
    section: "contact",
    keywords: "location where based live city country india hyderabad remote relocate timezone",
    text: profile.location,
    answer: `He's based in ${profile.location} (IST, UTC+5:30). For opportunities elsewhere or remote roles, reach out at ${profile.email}.`,
    followUps: ["How can I contact him?"],
  });

  chunks.push({
    id: "assistant",
    title: "About this assistant",
    section: "about",
    keywords: "how do you work this assistant chatbot bot you rag bm25 built how are you made llm gpt api",
    text: "in-browser retrieval augmented generation BM25 knowledge base no api",
    answer: `I'm a tiny RAG system running entirely in your browser. Your question is tokenized, stemmed and expanded with synonyms, then I score a knowledge base built from Ashwanth's portfolio with Okapi BM25 and answer from the best-matching chunk — with sources. No API keys, no servers. Open "How I answered" under any reply to see the retrieval trace.`,
    followUps: ["Who is Ashwanth?", "What's his tech stack?"],
  });

  return chunks;
}

export const knowledgeBase = buildKnowledgeBase();

/* ───────────────────────── Retrieval (BM25) ───────────────────────── */

const STOP = new Set(
  "a an the is are was were be been being am do does did of to in on for with at by from as and or but if then so than that this these those it its he his him she her they them their you your i me my we our what which who whom whose how why when where can could would should will shall may might must have has had tell show give about please any some there here into over also just more most very much many such only".split(
    " ",
  ),
);

// Light query expansion: maps a token to related index terms.
const SYNONYMS: Record<string, string[]> = {
  rag: ["retrieval", "augmented", "vector", "chatbot"],
  db: ["database"],
  vectordb: ["vector", "database"],
  stack: ["skills", "technologies"],
  tech: ["skills", "technologies"],
  tools: ["skills", "frameworks"],
  job: ["role", "work", "company"],
  work: ["role", "experience", "company"],
  hire: ["contact", "email", "opportunity"],
  email: ["contact"],
  reach: ["contact"],
  cv: ["resume", "contact"],
  school: ["education"],
  college: ["education"],
  study: ["education"],
  insurance: ["filing", "rate", "prop", "regulation"],
  compliance: ["regulation", "guardrails", "insurance"],
  dating: ["nudr", "recommendation"],
  recommender: ["recommendation", "nudr"],
  recsys: ["recommendation", "nudr"],
  matching: ["recommendation", "nudr"],
  redteam: ["red", "team", "gateway", "owasp"],
  jailbreak: ["injection", "gateway"],
  injection: ["prompt", "gateway", "security"],
  secure: ["security"],
  cyber: ["security"],
  incident: ["iris", "alerts"],
  bas: ["echosim", "simulation", "attack"],
  mitre: ["echosim", "attack"],
  siem: ["logs", "detection"],
  sigma: ["detection", "finetuning", "rules"],
  finetune: ["fine", "tuning", "qlora", "lora"],
  finetuning: ["fine", "tuning", "qlora", "lora"],
  qlora: ["fine", "tuning", "lora"],
  cnc: ["machine", "failure", "sensor", "xgboost"],
  predictive: ["failure", "prediction", "cnc"],
  certificates: ["certifications"],
  awards: ["achievements"],
  based: ["location"],
};

function stem(t: string) {
  if (t.length <= 4) return t;
  if (t.endsWith("ies")) return t.slice(0, -3) + "y";
  if (t.length > 5 && t.endsWith("ing")) return t.slice(0, -3);
  if (t.length > 5 && t.endsWith("ed")) return t.slice(0, -2);
  if (t.length > 5 && t.endsWith("es")) return t.slice(0, -2);
  if (t.endsWith("s") && !t.endsWith("ss") && !t.endsWith("us")) return t.slice(0, -1);
  return t;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\bb\.\s?tech\b/g, "btech")
    .replace(/['’]s\b/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/[\s\-./]+/)
    .map((t) => t.replace(/^[.#+]+|[.]+$/g, ""))
    .filter((t) => t && !STOP.has(t))
    .map(stem)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

type Index = {
  docs: { tf: Map<string, number>; len: number; boost: Set<string> }[];
  df: Map<string, number>;
  avgLen: number;
};

function buildIndex(chunks: Chunk[]): Index {
  const df = new Map<string, number>();
  const docs = chunks.map((c) => {
    const tokens = tokenize(`${c.title} ${c.keywords} ${c.text}`);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    const boost = new Set(tokenize(`${c.title} ${c.keywords}`));
    return { tf, len: tokens.length, boost };
  });
  const avgLen = docs.reduce((a, d) => a + d.len, 0) / docs.length;
  return { docs, df, avgLen };
}

const index = buildIndex(knowledgeBase);

const SYN = new Map(
  Object.entries(SYNONYMS).map(([k, v]) => [stem(k), v.map((x) => stem(x))] as const),
);

/** Original query terms weigh 1.0, synonym expansions 0.45. */
function expand(tokens: string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const t of tokens) out.set(t, 1);
  for (const t of tokens)
    for (const s of SYN.get(t) ?? []) if (!out.has(s)) out.set(s, 0.45);
  return out;
}

export function retrieve(query: string, k = 3): { results: Retrieved[]; tokens: string[] } {
  const weights = expand(tokenize(query));
  const tokens = [...weights.keys()];
  const N = knowledgeBase.length;
  const k1 = 1.4;
  const b = 0.7;

  const scored = knowledgeBase.map((chunk, i) => {
    const d = index.docs[i];
    let score = 0;
    for (const [t, w] of weights) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = index.df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      let s = idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / index.avgLen)));
      if (d.boost.has(t)) s += idf * 0.9; // title / keyword field boost
      score += s * w;
    }
    return { chunk, score };
  });

  const ranked = scored.filter((r) => r.score > 0).sort((a, b2) => b2.score - a.score);
  // keep only chunks reasonably close to the best match
  const results = ranked.filter((r) => r.score >= ranked[0].score * 0.3).slice(0, k);
  return { results, tokens };
}

/* ───────────────────────── Tool: skill lookup ───────────────────────── */

type SkillEntry = { name: string; group: string; aliases: string[] };

const EXTRA_ALIASES: Record<string, string[]> = {
  "Google Gemini API": ["gemini", "google gemini"],
  "Anthropic Claude API": ["claude", "anthropic"],
  "OpenAI API": ["openai", "gpt", "chatgpt"],
  "Hugging Face Transformers": ["hugging face", "huggingface", "hf"],
  "MongoDB Atlas Vector Search": ["atlas", "atlas vector search"],
  PostgreSQL: ["postgres"],
  MongoDB: ["mongo"],
  "scikit-learn": ["sklearn", "scikit"],
  PyTorch: ["torch"],
  "Fine-Tuning (LoRA, QLoRA)": ["fine tuning", "finetuning", "fine-tune", "fine tune"],
  "AI Agents": ["agents", "agent"],
  "Multi-Agent Systems": ["multi agent", "multiagent"],
  "Retrieval-Augmented Generation": ["rag"],
  "GitHub Actions (CI/CD)": ["ci cd", "cicd", "github actions"],
  "Tool / Function Calling": ["function calling", "tool calling", "tool use"],
  "Prompt Engineering": ["prompting"],
  LLMs: ["llm", "large language models"],
  ChromaDB: ["chroma"],
  "Machine Learning": ["ml"],
};

const skillEntries: SkillEntry[] = skills.flatMap((g) =>
  g.items.map((name) => {
    const base = name.replace(/\s*\(.*?\)\s*/g, " ").trim();
    const inner = (name.match(/\((.*?)\)/)?.[1] ?? "").split(/[,/]/).map((x) => x.trim()).filter(Boolean);
    const aliases = [name, base, ...inner, ...(EXTRA_ALIASES[name] ?? [])].map((a) => a.toLowerCase());
    return { name: name === "RAG" ? "Retrieval-Augmented Generation (RAG)" : name, group: g.group, aliases: [...new Set(aliases)] };
  }),
);
skillEntries.find((e) => e.aliases.includes("rag"))?.aliases.push(...EXTRA_ALIASES["Retrieval-Augmented Generation"]);

const SKILL_TRIGGER =
  /\b(know|knows|use|uses|used|using|familiar|experience (with|in)|experienced|worked (with|on)|work with|good at|skilled|proficient|expert|comfortable|handle|any)\b/i;

const escapeRe = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function lookupSkill(q: string): AssistantReply["answer"] | null {
  if (!SKILL_TRIGGER.test(q)) return null;
  const text = ` ${q.toLowerCase().replace(/[?!,]/g, " ")} `;
  let best: { entry: SkillEntry; len: number } | null = null;
  for (const entry of skillEntries)
    for (const a of entry.aliases) {
      const re = new RegExp(`(^|[^a-z0-9])${escapeRe(a)}([^a-z0-9]|$)`, "i");
      if (re.test(text) && (!best || a.length > best.len)) best = { entry, len: a.length };
    }
  if (!best) return null;
  const { entry } = best;
  const keys = entry.aliases.filter((a) => a.length > 2);
  const used = projects
    .filter((p) => {
      const hay = `${p.stack.join(" ")} ${p.highlights.join(" ")} ${p.problem}`.toLowerCase();
      return keys.some((k) => new RegExp(`(^|[^a-z0-9])${escapeRe(k)}([^a-z0-9]|$)`).test(hay));
    })
    .map((p) => `**${p.title}**`);
  return `Yes — **${entry.name}** is part of his ${entry.group} toolkit.${
    used.length ? ` He has used it in ${list(used.slice(0, 4))}.` : ""
  }`;
}

const HIRING =
  /\b(open to (work|opportunit\w*|new roles?)|hire|hiring|available|availability|looking for (a )?(job|role|opportunit\w*)|recruit\w*|job offer|notice period)\b/i;

const ABOUT_BOT =
  /\b(how (do|does|did) (you|this)|are you (an? )?(ai|bot|llm|gpt|human|real|chatgpt)|what are you|how (were|are) you (built|made)|which (model|llm) (are|do) you|is this (an? )?(ai|llm|gpt|chatgpt))\b/i;

const GREETING = /^(hi|hey|hello|yo|hola|namaste|good (morning|afternoon|evening)|sup|hii+)\b/i;
const THANKS = /^(thanks|thank you|thx|ty|cool|great|awesome|nice)\b/i;

export function ask(question: string): AssistantReply {
  const t0 = performance.now();
  const q = question.trim();

  const finish = (answer: string, sources: Retrieved[], followUps: string[], tokens: string[], method: string) => ({
    answer,
    sources,
    followUps,
    trace: { tokens, ms: performance.now() - t0, candidates: knowledgeBase.length, method },
  });

  if (GREETING.test(q) && q.split(/\s+/).length <= 4) {
    return finish(
      `Hi! 👋 I'm ${profile.firstName}'s portfolio assistant. Ask me about his experience, projects, skills, education or how to get in touch.`,
      [],
      ["Who is Ashwanth?", "What's his tech stack?", "Show me his best project"],
      [],
      "intent: greeting",
    );
  }
  if (THANKS.test(q) && q.split(/\s+/).length <= 4) {
    return finish(
      `Happy to help! If you'd like to talk to ${profile.firstName} directly, email ${profile.email}.`,
      [],
      ["How can I contact him?", "List his projects"],
      [],
      "intent: thanks",
    );
  }

  if (HIRING.test(q)) {
    const c = knowledgeBase.find((x) => x.id === "contact")!;
    return finish(c.answer, [{ chunk: c, score: 1 }], c.followUps ?? [], tokenize(q), "intent: hiring → contact");
  }

  if (ABOUT_BOT.test(q)) {
    const c = knowledgeBase.find((x) => x.id === "assistant")!;
    return finish(c.answer, [{ chunk: c, score: 1 }], c.followUps ?? [], tokenize(q), "intent: about-assistant");
  }

  const skillAnswer = lookupSkill(q);
  if (skillAnswer) {
    const { results, tokens } = retrieve(q, 3);
    return finish(
      skillAnswer,
      results,
      ["What's his tech stack?", "List his projects"],
      tokens,
      "tool: skill_lookup + BM25 sources",
    );
  }

  const { results, tokens } = retrieve(q, 3);
  const top = results[0];

  if (!top || top.score < 1.2) {
    return finish(
      `I couldn't find that in ${profile.firstName}'s portfolio — and I'd rather not make something up. Try asking about his experience, projects, skills or education, or email him at ${profile.email}.`,
      results,
      ["Who is Ashwanth?", "List his projects", "What's his tech stack?"],
      tokens,
      "BM25 · below confidence threshold",
    );
  }

  return finish(
    top.chunk.answer,
    results,
    top.chunk.followUps ?? ["List his projects", "How can I contact him?"],
    tokens,
    "BM25 · top-k=3",
  );
}

export const starterQuestions = [
  "Who is Ashwanth?",
  "What's his tech stack?",
  "Tell me about the LLM security gateway",
  "Has he fine-tuned models?",
  "How can I contact him?",
];
