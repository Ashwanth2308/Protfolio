/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PORTFOLIO CONTENT — single source of truth.
 *  Every section of the site (and the in-browser AI assistant) reads from here.
 *  Edit this file to update the site; no component changes needed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const profile = {
  name: "Alivelli Ashwanth",
  firstName: "Ashwanth",
  initials: "AA",
  role: "AI Engineer",
  roles: [
    "AI Engineer",
    "RAG Systems Builder",
    "AI Agent Developer",
    "LLM Security Engineer",
  ],
  location: "Hyderabad, India",
  company: "Cygne Noir Cyber",
  email: "yashalivelli9652@gmail.com",
  // Phone is intentionally not rendered on the page to avoid scraping/spam.
  // It is still available inside the downloadable resume.
  phone: "+91 9652754052",
  resume: "Alivelli_Ashwanth_Resume.pdf",
  socials: {
    github: "https://github.com/AlivelliAshwanth",
    linkedin: "https://www.linkedin.com/in/ashwanth-reddy-alivelli-69133a225",
  },
  tagline:
    "I design, build and ship production Generative AI — RAG systems, AI agents and compliance-aware LLM pipelines — with a security-first mindset.",
  summary: [
    "I'm an AI Engineer with 1.5+ years of experience building production Generative AI applications for cybersecurity and regulated insurance workflows at Cygne Noir Cyber.",
    "My day-to-day is Retrieval-Augmented Generation, AI agents and LLM pipelines built with Python, LangChain, LangGraph and FastAPI, backed by vector search on FAISS, ChromaDB, Pinecone and MongoDB Atlas.",
    "I treat security as a first-class feature of AI systems: prompt-injection defense, guardrails, automated red-teaming and rigorous LLM evaluation. I work across the OpenAI, Google Gemini and Anthropic Claude APIs, and fine-tune open-source LLMs with LoRA and QLoRA.",
  ],
};

export const stats = [
  { value: 1.5, suffix: "+", label: "Years building production GenAI", decimals: 1 },
  { value: 10, suffix: "", label: "AI & ML systems built", decimals: 0 },
  { value: 3, suffix: "", label: "Frontier LLM APIs: OpenAI, Gemini, Claude", decimals: 0 },
  { value: 95, suffix: "%", label: "Accuracy on CNC failure prediction", decimals: 0 },
];

export const focusAreas = [
  {
    icon: "database",
    title: "RAG & Retrieval",
    body: "Ingestion, chunking, embeddings, hybrid search and re-ranking that keep answers grounded and cited.",
  },
  {
    icon: "workflow",
    title: "Agentic AI",
    body: "Multi-step agents and multi-agent graphs in LangGraph with tool calling, MCP and structured outputs.",
  },
  {
    icon: "shield",
    title: "LLM Security",
    body: "Guardrail gateways, prompt-injection defense and automated red-teaming against the OWASP LLM Top 10.",
  },
  {
    icon: "flask",
    title: "Fine-tuning & Evals",
    body: "LoRA/QLoRA fine-tuning of open models with execution-based evaluation harnesses and cost/latency benchmarks.",
  },
];

export type ExperienceProject = {
  name: string;
  context?: string;
  points: string[];
  projectId?: string;
};

export type Experience = {
  role: string;
  company: string;
  period: string;
  start: string;
  current?: boolean;
  location: string;
  summary: string;
  projects: ExperienceProject[];
};

export const experience: Experience[] = [
  {
    role: "Associate AI Engineer",
    company: "Cygne Noir Cyber",
    period: "Nov 2025 — Present",
    start: "2025-11",
    current: true,
    location: "Hyderabad, India",
    summary:
      "Building GenAI across regulated insurance, consumer recommendation and cybersecurity products — from RAG and agents to LLM security.",
    projects: [
      {
        name: "Insurance Rate Filing Automation",
        context: "California P&C insurance client",
        projectId: "rate-filing",
        points: [
          "Built a RAG system on the Google Gemini API and MongoDB to automate California Department of Insurance Prior Approval rate filings for Property & Casualty lines under Proposition 103.",
          "Engineered a regulatory authority hierarchy and compliance guardrails so generated outputs follow state rules and cite the governing regulation.",
          "Implemented field-by-field analysis of actuarial filings: LDFs, DCCE, MPEP, credibility complements and SERFF submission requirements.",
        ],
      },
      {
        name: "Nudr — Recommendation Engine",
        context: "Dating app",
        projectId: "nudr",
        points: [
          "Developed an embedding-based engine that represents each user's profile, interests and preferences as vectors to score compatibility.",
          "Implemented two-stage matching: Pinecone candidate retrieval, then re-ranking on location, recent activity and similarity.",
          "Added a behavioral feedback loop that learns from likes, skips and messages.",
        ],
      },
      {
        name: "IRIS — AI-Driven Incident Response",
        projectId: "iris",
        points: [
          "Built core modules of a platform that uses LLMs to analyze security alerts, correlate related events and recommend guided responses.",
          "Developed backend services and LLM pipelines in Python and FastAPI with structured outputs for analyst-ready reports.",
        ],
      },
      {
        name: "Echosim — Breach & Attack Simulation",
        projectId: "echosim",
        points: [
          "Developed adversary emulation capabilities that simulate real-world techniques mapped to MITRE ATT&CK to validate security controls.",
          "Applied LLMs to generate attack scenarios and readable simulation reports.",
        ],
      },
      {
        name: "LLM Agent Security Gateway",
        context: "Internal POC",
        projectId: "gateway",
        points: [
          "Built a guardrail gateway that detects prompt injection, jailbreaks, PII leakage and unsafe tool calls in real time.",
          "Developed a LangGraph red-teaming agent generating direct and indirect injections mapped to the OWASP Top 10 for LLMs.",
          "Benchmarked attack success rate, false positives and latency overhead; shipped as a Dockerized, OpenAI-compatible FastAPI service.",
        ],
      },
    ],
  },
  {
    role: "AI Engineer Trainee",
    company: "Cygne Noir Cyber",
    period: "Mar 2025 — Oct 2025",
    start: "2025-03",
    location: "Hyderabad, India",
    summary:
      "Shipped the first internal GenAI tools — a grounded RAG chatbot, synthetic SIEM data and LLM-powered threat intelligence.",
    projects: [
      {
        name: "Internal RAG Chatbot",
        projectId: "rag-chatbot",
        points: [
          "Built a RAG chatbot that answers employee questions over internal documentation with source-cited responses, replacing manual search.",
          "Implemented ingestion — parsing, chunking, embeddings, vector search — and tuned retrieval and prompts to keep answers grounded.",
        ],
      },
      {
        name: "SIEM Log Generation",
        projectId: "siem-logs",
        points: [
          "Built synthetic log generators using few-shot and chain-of-thought prompting, producing realistic firewall, IDS and authentication events for detection testing.",
        ],
      },
      {
        name: "LLM Threat Intelligence Tools",
        projectId: "threat-intel",
        points: [
          "Developed LLM tools that turn unstructured threat reports into structured, analyst-ready intelligence.",
        ],
      },
    ],
  },
];

export type ProjectCategory = "GenAI & RAG" | "AI Security" | "ML & Recsys";

export type Project = {
  id: string;
  title: string;
  tagline: string;
  category: ProjectCategory;
  type: string;
  period?: string;
  featured?: boolean;
  problem: string;
  highlights: string[];
  pipeline: { label: string; detail: string }[];
  stack: string[];
  metric?: { value: string; label: string };
  links?: { label: string; href: string }[];
  /** Key design decisions: what was chosen and why it matters. */
  decisions?: { title: string; body: string }[];
  /** Outcomes. Add real numbers here as you have them. */
  results?: string[];
  /** "What I'd do differently". Your own reflections; hidden when empty. */
  lessons?: string[];
};

export const projects: Project[] = [
  {
    id: "rate-filing",
    title: "Insurance Rate Filing Automation",
    tagline: "Compliance-aware RAG for California Prop 103 rate filings",
    category: "GenAI & RAG",
    type: "Client · Cygne Noir Cyber",
    featured: true,
    problem:
      "Prior Approval rate filings with the California Department of Insurance are long, heavily regulated and reviewed field by field. Outputs must follow state rules and cite the regulation that governs them.",
    highlights: [
      "RAG system on the Google Gemini API with MongoDB as the knowledge store.",
      "Regulatory authority hierarchy + compliance guardrails so every output follows state rules and cites the governing regulation.",
      "Field-by-field analysis of actuarial exhibits: loss development factors (LDF), DCCE, MPEP, credibility complements and SERFF requirements.",
    ],
    pipeline: [
      { label: "Filing docs", detail: "Actuarial exhibits & SERFF forms" },
      { label: "Field extraction", detail: "LDF, DCCE, MPEP, credibility" },
      { label: "Retrieval", detail: "MongoDB knowledge store" },
      { label: "Authority ranking", detail: "Regulatory hierarchy" },
      { label: "Gemini + guardrails", detail: "Compliance-checked generation" },
      { label: "Cited output", detail: "Rule-linked filing sections" },
    ],
    decisions: [
      { title: "Regulatory authority hierarchy", body: "Retrieved sources are ranked by regulatory authority, so the output follows the governing state rule and cites it." },
      { title: "Field-by-field analysis", body: "Actuarial filings are analyzed one field at a time (LDF, DCCE, MPEP, credibility complements) so each value is checked against its own requirements." },
      { title: "Compliance guardrails on every output", body: "Generated sections pass compliance guardrails before they are used, so outputs stay within state rules." },
    ],
    results: [
      "Automates California Department of Insurance Prior Approval rate filings for Property & Casualty lines under Proposition 103.",
      "Every generated output cites the regulation that governs it.",
    ],
    stack: ["Python", "Google Gemini API", "MongoDB", "RAG", "Guardrails", "Structured Outputs"],
    metric: { value: "Prop 103", label: "Regulated P&C workflow" },
  },
  {
    id: "gateway",
    title: "LLM Agent Security Gateway",
    tagline: "Real-time guardrails + automated red-teaming for LLM agents",
    category: "AI Security",
    type: "Internal POC · Cygne Noir Cyber",
    featured: true,
    problem:
      "LLM agents with tools are exposed to prompt injection, jailbreaks and data leakage. Teams need a drop-in layer that blocks attacks without slowing every request down, and a way to prove it works.",
    highlights: [
      "Guardrail gateway detecting prompt injection, jailbreaks, PII leakage and unsafe tool calls in real time.",
      "Automated red-teaming agent in LangGraph generating direct and indirect prompt-injection attacks mapped to the OWASP Top 10 for LLM Applications.",
      "Benchmarked attack success rate, false-positive rate and latency overhead with vs. without the gateway.",
      "Shipped as a Dockerized FastAPI service exposing an OpenAI-compatible API, so it drops in front of existing clients.",
    ],
    pipeline: [
      { label: "Client request", detail: "OpenAI-compatible API" },
      { label: "Input scanners", detail: "Injection · jailbreak · PII" },
      { label: "Policy engine", detail: "Allow / redact / block" },
      { label: "LLM agent", detail: "Tool calls checked" },
      { label: "Output scanners", detail: "PII leakage · unsafe actions" },
      { label: "Red-team loop", detail: "LangGraph attacker · OWASP LLM" },
    ],
    decisions: [
      { title: "OpenAI-compatible API", body: "The gateway exposes an OpenAI-compatible API, so existing clients can sit behind it by changing their base URL." },
      { title: "Inspect inputs, outputs and tool calls", body: "Detection covers prompt injection, jailbreaks, PII leakage and unsafe tool calls, in real time." },
      { title: "Red-team against the same taxonomy", body: "A LangGraph agent generates direct and indirect injection attacks mapped to the OWASP Top 10 for LLM Applications, so the gateway is tested against the categories it defends." },
      { title: "Measure with and without the gateway", body: "Attack success rate, false-positive rate and latency overhead are benchmarked in both configurations." },
    ],
    results: [
      "Shipped as a Dockerized FastAPI service.",
      "Benchmarked on attack success rate, false-positive rate and latency overhead, with vs. without the gateway.",
    ],
    stack: ["Python", "FastAPI", "LangGraph", "Docker", "OWASP LLM Top 10", "OpenAI API"],
    metric: { value: "OWASP", label: "LLM Top 10 coverage" },
  },
  {
    id: "detection-llm",
    title: "Fine-Tuned LLM for Detection Rules",
    tagline: "QLoRA-tuned 7B model that writes Sigma detection rules",
    category: "AI Security",
    type: "Personal project",
    featured: true,
    problem:
      "Writing SIEM detection rules from attack descriptions is slow, expert work. Can a small fine-tuned open model match a frontier API on accuracy, at lower cost and latency?",
    highlights: [
      "Fine-tuned an open-source 7B LLM with QLoRA (Hugging Face Transformers + PEFT) on synthetic attack-log ↔ Sigma-rule pairs.",
      "Execution-based evaluation harness: generated Sigma rules run against held-out attack and benign logs to measure detection rate and false positives.",
      "Compared against a frontier API model on accuracy, cost and latency; served with vLLM behind FastAPI.",
    ],
    pipeline: [
      { label: "Synthetic data", detail: "Attack logs ↔ Sigma rules" },
      { label: "QLoRA fine-tune", detail: "7B · Transformers + PEFT" },
      { label: "Generate rules", detail: "From attack descriptions" },
      { label: "Execute & score", detail: "Held-out attack + benign logs" },
      { label: "Benchmark", detail: "vs frontier API: acc · cost · latency" },
      { label: "Serve", detail: "vLLM behind FastAPI" },
    ],
    decisions: [
      { title: "QLoRA on a 7B open model", body: "Fine-tuning with 4-bit quantized weights and LoRA adapters (Transformers + PEFT) keeps GPU memory needs low." },
      { title: "Evaluate by running the rules", body: "Generated Sigma rules are executed against held-out attack and benign logs, measuring detection rate and false positives rather than text similarity." },
      { title: "Compare against a frontier API", body: "The fine-tuned model is compared with a frontier API model on accuracy, cost and latency." },
      { title: "Serve with vLLM", body: "The model is served with vLLM behind FastAPI." },
    ],
    results: ["Execution-based evaluation harness measuring detection rate and false positives on held-out logs."],
    stack: ["PyTorch", "Hugging Face Transformers", "PEFT", "QLoRA", "vLLM", "FastAPI", "Sigma"],
    metric: { value: "7B", label: "QLoRA fine-tuned model" },
    links: [{ label: "GitHub", href: "https://github.com/AlivelliAshwanth" }],
  },
  {
    id: "iris",
    title: "IRIS — AI Incident Response",
    tagline: "LLMs that triage alerts, correlate events and guide response",
    category: "AI Security",
    type: "Product · Cygne Noir Cyber",
    featured: true,
    problem:
      "Security analysts drown in alerts. IRIS uses LLMs to analyze alerts, correlate related events and produce guided, consistent response recommendations.",
    highlights: [
      "Built core modules of an AI-driven incident response platform.",
      "LLM pipelines that analyze security alerts, correlate related events and generate guided response recommendations.",
      "Backend services in Python and FastAPI using structured outputs for consistent, analyst-ready incident reports.",
    ],
    pipeline: [
      { label: "Security alerts", detail: "Raw events" },
      { label: "LLM analysis", detail: "Alert understanding" },
      { label: "Correlation", detail: "Group related events" },
      { label: "Recommendations", detail: "Guided response steps" },
      { label: "Structured report", detail: "Analyst-ready output" },
    ],
    decisions: [
      { title: "Structured outputs", body: "LLM pipelines return structured outputs, which keeps incident reports consistent and analyst-ready." },
      { title: "Correlate before recommending", body: "Related security events are correlated before the system generates guided response recommendations." },
    ],
    stack: ["Python", "FastAPI", "LLM Pipelines", "Structured Outputs", "Pydantic"],
  },
  {
    id: "nudr",
    title: "Nudr — Recommendation Engine",
    tagline: "Two-stage vector matching with a behavioral feedback loop",
    category: "ML & Recsys",
    type: "Client · Cygne Noir Cyber",
    featured: true,
    problem:
      "A dating app needs matches that feel relevant: compatible interests and preferences, nearby, recently active — and getting better as users interact.",
    highlights: [
      "Embedding-based engine representing each user's profile, interests and stated preferences as vectors to score compatibility.",
      "Two-stage matching: fast candidate retrieval with Pinecone vector search, then re-ranking on location, recent activity and similarity.",
      "Behavioral feedback loop that learns from likes, skips and messages to refine recommendations over time.",
    ],
    pipeline: [
      { label: "User profile", detail: "Interests & preferences" },
      { label: "Embeddings", detail: "Profile vectors" },
      { label: "Candidate retrieval", detail: "Pinecone ANN search" },
      { label: "Re-ranking", detail: "Location · activity · similarity" },
      { label: "Feedback loop", detail: "Likes · skips · messages" },
    ],
    decisions: [
      { title: "Two-stage matching", body: "Fast candidate retrieval with Pinecone vector search, then re-ranking on location, recent activity and similarity scores." },
      { title: "Profiles as vectors", body: "Each user's profile, interests and stated preferences are embedded so compatibility can be scored by similarity." },
      { title: "Behavioral feedback loop", body: "Likes, skips and messages feed back into the model to refine recommendations over time." },
    ],
    stack: ["Python", "Pinecone", "Embeddings", "Recommendation Systems", "Re-ranking"],
    metric: { value: "2-stage", label: "Retrieve → re-rank" },
  },
  {
    id: "echosim",
    title: "Echosim — Breach & Attack Simulation",
    tagline: "Adversary emulation mapped to MITRE ATT&CK",
    category: "AI Security",
    type: "Product · Cygne Noir Cyber",
    featured: true,
    problem:
      "Security controls are only as good as the attacks they're tested against. Echosim emulates real-world adversary techniques to validate defenses.",
    highlights: [
      "Developed adversary emulation capabilities simulating real-world techniques mapped to MITRE ATT&CK.",
      "Applied LLMs to generate attack scenarios and produce readable simulation reports for security teams.",
    ],
    pipeline: [
      { label: "ATT&CK techniques", detail: "Technique library" },
      { label: "LLM scenarios", detail: "Attack scenario generation" },
      { label: "Emulation", detail: "Simulated adversary actions" },
      { label: "Control validation", detail: "Detect / prevent?" },
      { label: "LLM report", detail: "Readable findings" },
    ],
    decisions: [
      { title: "Map everything to MITRE ATT&CK", body: "Simulated techniques are mapped to MITRE ATT&CK, so results line up with how security teams already describe coverage." },
      { title: "LLMs for scenarios and reports", body: "LLMs generate attack scenarios and turn simulation results into readable reports." },
    ],
    stack: ["Python", "LLMs", "MITRE ATT&CK", "Adversary Emulation"],
  },
  {
    id: "rag-chatbot",
    title: "Internal RAG Chatbot",
    tagline: "Source-cited answers over company documentation",
    category: "GenAI & RAG",
    type: "Internal · Cygne Noir Cyber",
    problem:
      "Employees were searching internal documentation manually. A grounded chatbot answers questions with citations back to the source.",
    highlights: [
      "RAG chatbot answering employee questions over internal docs with source-cited responses, replacing manual document search.",
      "End-to-end ingestion: document parsing, chunking, embeddings and vector search.",
      "Tuned retrieval and prompts to keep answers grounded and reduce hallucination.",
    ],
    pipeline: [
      { label: "Documents", detail: "Internal knowledge" },
      { label: "Parse & chunk", detail: "Ingestion pipeline" },
      { label: "Embed & index", detail: "Vector store" },
      { label: "Retrieve", detail: "Semantic search" },
      { label: "Grounded answer", detail: "With source citations" },
    ],
    decisions: [
      { title: "Source-cited answers", body: "Every response cites the internal documents it came from." },
      { title: "Tune retrieval and prompts for grounding", body: "Parsing, chunking, embeddings and vector search were tuned together with the prompts to keep answers grounded." },
    ],
    results: ["Replaced manual document search for employees."],
    stack: ["Python", "LangChain", "Embeddings", "Vector Search", "Prompt Engineering"],
  },
  {
    id: "siem-logs",
    title: "Synthetic SIEM Log Generation",
    tagline: "Realistic firewall, IDS & auth events for detection testing",
    category: "GenAI & RAG",
    type: "Internal · Cygne Noir Cyber",
    problem:
      "Detection engineering needs realistic, varied logs to test against — without exposing real customer data.",
    highlights: [
      "Synthetic log generators for SIEM platforms using few-shot and chain-of-thought prompting.",
      "Produces realistic firewall, IDS and authentication events for detection testing.",
    ],
    pipeline: [
      { label: "Event schema", detail: "Firewall · IDS · auth" },
      { label: "Few-shot + CoT", detail: "Prompted generation" },
      { label: "Synthetic logs", detail: "Realistic events" },
      { label: "Detection tests", detail: "SIEM validation" },
    ],
    stack: ["Python", "Prompt Engineering", "Few-shot", "Chain-of-Thought", "SIEM"],
  },
  {
    id: "threat-intel",
    title: "LLM Threat Intelligence Tools",
    tagline: "Unstructured threat reports → structured intelligence",
    category: "GenAI & RAG",
    type: "Internal · Cygne Noir Cyber",
    problem:
      "Threat reports arrive as long, unstructured prose. Analysts need structured, consistent intelligence they can act on.",
    highlights: [
      "LLM-based tools that turn unstructured threat reports into structured, analyst-ready intelligence for security use cases.",
    ],
    pipeline: [
      { label: "Threat reports", detail: "Unstructured text" },
      { label: "LLM extraction", detail: "Structured outputs" },
      { label: "Normalized intel", detail: "Analyst-ready" },
    ],
    stack: ["Python", "LLMs", "Structured Outputs", "NLP"],
  },
  {
    id: "cnc",
    title: "CNC Machine Failure Prediction",
    tagline: "Real-time XGBoost failure forecasting from live sensor streams",
    category: "ML & Recsys",
    type: "Final-year project · MLR Institute of Technology",
    period: "Jan 2024 — Apr 2024",
    featured: true,
    problem:
      "Unexpected CNC machine failures halt production. Can live sensor data flag abnormal behavior early enough to prevent them?",
    highlights: [
      "Collected real-time vibration, temperature, spindle-speed and current data from sensors on the college's CNC machines during live machining.",
      "Preprocessing pipeline that cleaned and labeled live streams and derived health indicators — rolling averages, vibration peaks, temperature trends over sliding windows.",
      "XGBoost classifier flagging abnormal behavior and forecasting failures in real time at 95% accuracy, tracking precision, recall and F1 to limit missed failures.",
    ],
    pipeline: [
      { label: "Live sensors", detail: "Vibration · temp · spindle · current" },
      { label: "Clean & label", detail: "Stream preprocessing" },
      { label: "Features", detail: "Sliding-window health indicators" },
      { label: "XGBoost", detail: "Anomaly + failure forecast" },
      { label: "Real-time alerts", detail: "95% accuracy" },
    ],
    decisions: [
      { title: "Sliding-window health indicators", body: "Rolling averages, vibration peaks and temperature trends are computed over sliding time windows from live sensor streams." },
      { title: "Track precision, recall and F1", body: "Beyond accuracy, precision, recall and F1 were tracked to limit missed failures." },
    ],
    results: ["95% accuracy predicting abnormal behavior and failures in real time.", "Trained on real sensor data collected from the college's CNC machines during live machining."],
    stack: ["Python", "XGBoost", "pandas", "NumPy", "scikit-learn", "Time Series"],
    metric: { value: "95%", label: "Prediction accuracy" },
  },
];

export const skills: { group: string; icon: string; items: string[] }[] = [
  {
    group: "Generative AI & LLMs",
    icon: "brain",
    items: [
      "LLMs",
      "Generative AI",
      "RAG",
      "Agentic AI",
      "AI Agents",
      "Multi-Agent Systems",
      "Prompt Engineering",
      "Tool / Function Calling",
      "Model Context Protocol (MCP)",
      "Structured Outputs",
      "Fine-Tuning (LoRA, QLoRA)",
      "LLM Evaluation",
      "Guardrails",
      "Hallucination Mitigation",
    ],
  },
  {
    group: "LLM Frameworks & APIs",
    icon: "layers",
    items: [
      "LangChain",
      "LangGraph",
      "LlamaIndex",
      "Hugging Face Transformers",
      "PEFT",
      "vLLM",
      "Ollama",
      "LangSmith",
      "OpenAI API",
      "Google Gemini API",
      "Anthropic Claude API",
    ],
  },
  {
    group: "Vector DBs & Retrieval",
    icon: "database",
    items: [
      "FAISS",
      "ChromaDB",
      "Pinecone",
      "MongoDB Atlas Vector Search",
      "Embeddings",
      "Semantic Search",
      "Hybrid Search (BM25)",
      "Re-ranking",
    ],
  },
  {
    group: "Machine Learning & NLP",
    icon: "cpu",
    items: [
      "PyTorch",
      "scikit-learn",
      "XGBoost",
      "Recommendation Systems",
      "NLP",
      "Transformers",
      "Deep Learning",
      "pandas",
      "NumPy",
    ],
  },
  {
    group: "Programming & Databases",
    icon: "code",
    items: ["Python", "SQL", "Java", "MongoDB", "PostgreSQL", "MySQL", "Redis"],
  },
  {
    group: "Backend, MLOps & Cloud",
    icon: "server",
    items: ["FastAPI", "REST APIs", "Pydantic", "Docker", "Git", "GitHub Actions (CI/CD)", "AWS", "Linux"],
  },
];

export const education = {
  degree: "B.Tech — Computer Science & Engineering (Data Science)",
  school: "MLR Institute of Technology",
  location: "Hyderabad",
  period: "2021 — 2024",
  grade: "CGPA 8.0 / 10",
};

export const achievements = [
  { title: "TCS CodeVita Season 10", detail: "Global Rank 4533", year: "2022", icon: "trophy" },
  { title: "HackerRank", detail: "Gold badges in Python & Java · Silver in SQL", icon: "medal" },
  { title: "Smart Interviews", detail: "Smart Coder certification — Data Structures & Algorithms", icon: "award" },
  { title: "NPTEL", detail: "Data Analytics with Python", year: "2023", icon: "award" },
  { title: "IBM", detail: "Python for Data Science", year: "2021", icon: "award" },
];

/** Recruiter quick view + hero facts. Keep it factual: every line maps to the resume. */
export const recruiter = {
  headline: "AI Engineer building production RAG, AI agents and secure LLM systems",
  facts: [
    { label: "Experience", value: "1.5+ yrs production GenAI" },
    { label: "Current role", value: "Associate AI Engineer, Cygne Noir Cyber" },
    { label: "Education", value: "B.Tech CSE (Data Science) · CGPA 8.0" },
    { label: "Location", value: "Hyderabad, India · IST (UTC+5:30)" },
  ],
  strengths: [
    {
      title: "Production RAG in regulated domains",
      body: "Compliance-aware RAG for California Prop 103 insurance rate filings, with guardrails that cite the governing regulation.",
    },
    {
      title: "Security-first LLM systems",
      body: "Real-time guardrail gateway plus a LangGraph red-teaming agent mapped to the OWASP Top 10 for LLMs.",
    },
    {
      title: "End-to-end AI engineering",
      body: "QLoRA fine-tuning, execution-based evals, vLLM serving, FastAPI services, Docker and four vector stores.",
    },
  ],
  topProjects: ["rate-filing", "gateway", "detection-llm"],
  coreStack: [
    "Python",
    "LangChain",
    "LangGraph",
    "FastAPI",
    "RAG",
    "AI Agents",
    "OpenAI · Gemini · Claude",
    "Pinecone · FAISS · Atlas",
    "QLoRA / PEFT",
    "vLLM",
    "Docker",
    "AWS",
  ],
  domains: [
    { label: "Cybersecurity", icon: "shield" },
    { label: "Regulated insurance (P&C)", icon: "scale" },
    { label: "Consumer apps", icon: "heart" },
    { label: "Manufacturing ML", icon: "factory" },
  ],
};

export const navLinks = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "lab", label: "AI Lab" },
  { id: "skills", label: "Skills" },
  { id: "fit", label: "Fit check" },
  { id: "contact", label: "Contact" },
];

/** Extra sections reachable from the command palette. */
export const extraSections = [{ id: "education", label: "Education" }];
