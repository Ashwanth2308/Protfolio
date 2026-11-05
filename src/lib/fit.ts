/**
 * Job-description fit analyzer (runs in the browser).
 *
 * 1. Extracts skills from a pasted JD with an alias dictionary (incl. skills
 *    Ashwanth does NOT have, so gaps are reported honestly).
 * 2. Maps each found skill to evidence from his projects, or to a transferable
 *    skill he does have, or marks it as a gap.
 * 3. Scores coverage = (matched + 0.4 × transferable) / required (core skills weigh 1.5×).
 * 4. Checks years of experience, degree and location mentions.
 */
import { education, profile, projects } from "../data/portfolio";

type Skill = {
  id: string;
  label: string;
  aliases: string[];
  have: boolean;
  evidence?: string[]; // project ids
  via?: string[]; // labels of his skills that transfer
  core?: boolean; // weighs more in the score
};

const S = (
  id: string,
  label: string,
  aliases: string[],
  have: boolean,
  extra: Partial<Pick<Skill, "evidence" | "via" | "core">> = {},
): Skill => ({ id, label, aliases, have, ...extra });

/* ───────── Skills he has (with evidence) ───────── */
const HAVE: Skill[] = [
  S("python", "Python", ["python"], true, { evidence: ["rate-filing", "gateway", "detection-llm"], core: true }),
  S("llm", "LLMs", ["llm", "llms", "large language model", "large language models", "foundation model", "foundation models"], true, { evidence: ["rate-filing", "iris", "gateway"], core: true }),
  S("genai", "Generative AI", ["generative ai", "genai", "gen ai", "gen-ai"], true, { evidence: ["rate-filing", "rag-chatbot"], core: true }),
  S("rag", "RAG", ["rag", "retrieval augmented generation", "retrieval-augmented generation", "retrieval augmented", "grounded generation"], true, { evidence: ["rate-filing", "rag-chatbot"], core: true }),
  S("agents", "AI agents", ["agent", "agents", "agentic", "ai agents", "autonomous agents", "agentic ai", "agentic workflows"], true, { evidence: ["gateway"], core: true }),
  S("multiagent", "Multi-agent systems", ["multi-agent", "multi agent", "multiagent"], true, { evidence: ["gateway"] }),
  S("langchain", "LangChain", ["langchain", "lang chain"], true, { evidence: ["rag-chatbot"] }),
  S("langgraph", "LangGraph", ["langgraph", "lang graph"], true, { evidence: ["gateway"] }),
  S("llamaindex", "LlamaIndex", ["llamaindex", "llama index", "llama-index"], true),
  S("prompt", "Prompt engineering", ["prompt engineering", "prompting", "prompt design", "few-shot", "chain-of-thought", "chain of thought"], true, { evidence: ["siem-logs", "rag-chatbot"] }),
  S("finetune", "Fine-tuning (LoRA / QLoRA)", ["fine-tuning", "fine tuning", "finetuning", "fine-tune", "fine tune", "lora", "qlora", "peft", "parameter-efficient", "sft", "instruction tuning"], true, { evidence: ["detection-llm"], core: true }),
  S("hf", "Hugging Face Transformers", ["hugging face", "huggingface", "transformers library", "hf transformers"], true, { evidence: ["detection-llm"] }),
  S("transformers", "Transformers / deep learning", ["transformer", "transformers", "deep learning", "neural networks", "neural network"], true, { evidence: ["detection-llm"] }),
  S("pytorch", "PyTorch", ["pytorch", "torch"], true, { evidence: ["detection-llm"] }),
  S("vllm", "vLLM / model serving", ["vllm", "model serving", "llm serving", "inference serving", "serving models", "model deployment", "deploy models", "deploying models"], true, { evidence: ["detection-llm"] }),
  S("ollama", "Ollama / local LLMs", ["ollama", "local llms", "open-source llms", "open source llms", "open-source models", "llama", "mistral"], true, { evidence: ["detection-llm"] }),
  S("eval", "LLM evaluation", ["evaluation", "evals", "llm evaluation", "benchmarking", "benchmark", "model evaluation", "eval harness"], true, { evidence: ["detection-llm", "gateway"], core: true }),
  S("langsmith", "LangSmith / observability", ["langsmith", "llm observability", "tracing"], true),
  S("openai", "OpenAI API", ["openai", "gpt-4", "gpt-4o", "gpt", "chatgpt", "openai api"], true, { evidence: ["gateway"] }),
  S("gemini", "Google Gemini API", ["gemini", "google gemini", "palm"], true, { evidence: ["rate-filing"] }),
  S("claude", "Anthropic Claude API", ["claude", "anthropic"], true),
  S("embeddings", "Embeddings & semantic search", ["embedding", "embeddings", "semantic search", "vector search", "similarity search", "dense retrieval"], true, { evidence: ["nudr", "rag-chatbot"], core: true }),
  S("vectordb", "Vector databases", ["vector database", "vector databases", "vector db", "vector dbs", "vector store", "vector stores"], true, { evidence: ["nudr", "rag-chatbot"], core: true }),
  S("faiss", "FAISS", ["faiss"], true),
  S("chroma", "ChromaDB", ["chroma", "chromadb"], true),
  S("pinecone", "Pinecone", ["pinecone"], true, { evidence: ["nudr"] }),
  S("atlas", "MongoDB Atlas Vector Search", ["atlas vector search", "mongodb atlas", "atlas"], true, { evidence: ["rate-filing"] }),
  S("hybrid", "Hybrid search / BM25 / re-ranking", ["hybrid search", "bm25", "re-ranking", "reranking", "rerank", "reranker", "re-ranker", "information retrieval"], true, { evidence: ["nudr"] }),
  S("mcp", "Model Context Protocol (MCP)", ["mcp", "model context protocol"], true),
  S("tools", "Tool / function calling", ["function calling", "tool calling", "tool use", "tool-use", "tools api"], true, { evidence: ["gateway"] }),
  S("structured", "Structured outputs", ["structured output", "structured outputs", "json mode", "json schema"], true, { evidence: ["iris", "threat-intel"] }),
  S("guardrails", "Guardrails & LLM safety", ["guardrail", "guardrails", "ai safety", "llm safety", "responsible ai", "content moderation", "safety filters"], true, { evidence: ["gateway", "rate-filing"], core: true }),
  S("llmsec", "LLM security / red-teaming", ["prompt injection", "jailbreak", "jailbreaks", "red teaming", "red-teaming", "red team", "adversarial testing", "owasp", "ai security", "llm security"], true, { evidence: ["gateway"], core: true }),
  S("hallucination", "Hallucination mitigation", ["hallucination", "hallucinations", "grounding", "factuality"], true, { evidence: ["rag-chatbot", "rate-filing"] }),
  S("cyber", "Cybersecurity domain", ["cybersecurity", "cyber security", "security operations", "siem", "threat intelligence", "incident response", "mitre", "att&ck", "detection engineering", "sigma"], true, { evidence: ["iris", "echosim", "siem-logs"] }),
  S("ml", "Machine learning", ["machine learning", "ml", "predictive modeling", "predictive modelling", "classification", "supervised learning"], true, { evidence: ["cnc", "nudr"], core: true }),
  S("nlp", "NLP", ["nlp", "natural language processing", "text classification", "information extraction", "ner"], true, { evidence: ["threat-intel", "rag-chatbot"] }),
  S("recsys", "Recommendation systems", ["recommendation", "recommendations", "recommender", "recommender systems", "recommendation systems", "personalization"], true, { evidence: ["nudr"] }),
  S("sklearn", "scikit-learn", ["scikit-learn", "sklearn", "scikit learn"], true, { evidence: ["cnc"] }),
  S("xgboost", "XGBoost / gradient boosting", ["xgboost", "gradient boosting", "lightgbm", "boosted trees"], true, { evidence: ["cnc"] }),
  S("pandas", "pandas / NumPy", ["pandas", "numpy", "data wrangling", "data analysis"], true, { evidence: ["cnc"] }),
  S("timeseries", "Time series / sensor data", ["time series", "time-series", "sensor data", "iot", "anomaly detection", "predictive maintenance"], true, { evidence: ["cnc"] }),
  S("fastapi", "FastAPI", ["fastapi", "fast api"], true, { evidence: ["gateway", "iris", "detection-llm"] }),
  S("rest", "REST APIs / backend", ["rest api", "rest apis", "restful", "api development", "backend", "back-end", "web services"], true, { evidence: ["gateway", "iris"] }),
  S("pydantic", "Pydantic", ["pydantic"], true, { evidence: ["iris"] }),
  S("docker", "Docker", ["docker", "containers", "containerization", "containerisation"], true, { evidence: ["gateway"] }),
  S("cicd", "CI/CD (GitHub Actions)", ["ci/cd", "ci cd", "cicd", "github actions", "continuous integration"], true),
  S("git", "Git", ["git", "github", "version control"], true),
  S("aws", "AWS", ["aws", "amazon web services", "ec2", "s3", "lambda"], true),
  S("linux", "Linux", ["linux", "unix", "bash", "shell scripting"], true),
  S("sql", "SQL", ["sql"], true),
  S("mongodb", "MongoDB", ["mongodb", "mongo", "nosql"], true, { evidence: ["rate-filing"] }),
  S("postgres", "PostgreSQL", ["postgresql", "postgres"], true),
  S("mysql", "MySQL", ["mysql"], true),
  S("redis", "Redis", ["redis"], true),
  S("java", "Java", ["java"], true),
  S("dsa", "Data structures & algorithms", ["data structures", "algorithms", "dsa", "problem solving", "problem-solving"], true),
];

/* ───────── Common JD skills he does not list (gaps / transferable) ───────── */
const GAPS: Skill[] = [
  S("k8s", "Kubernetes", ["kubernetes", "k8s", "eks", "gke", "aks", "helm"], false, { via: ["Docker"] }),
  S("tf", "TensorFlow / Keras", ["tensorflow", "keras"], false, { via: ["PyTorch"] }),
  S("jax", "JAX", ["jax"], false, { via: ["PyTorch"] }),
  S("azure", "Azure", ["azure", "microsoft azure"], false, { via: ["AWS"] }),
  S("gcp", "Google Cloud (GCP)", ["gcp", "google cloud", "bigquery", "cloud run"], false, { via: ["AWS"] }),
  S("vertex", "Vertex AI", ["vertex ai"], false, { via: ["Google Gemini API"] }),
  S("bedrock", "AWS Bedrock", ["bedrock", "amazon bedrock", "aws bedrock"], false, { via: ["AWS", "Anthropic Claude API"] }),
  S("sagemaker", "SageMaker", ["sagemaker"], false, { via: ["AWS", "vLLM"] }),
  S("othervec", "Weaviate / Qdrant / Milvus / pgvector", ["weaviate", "qdrant", "milvus", "pgvector", "elasticsearch", "opensearch"], false, { via: ["Pinecone", "FAISS", "ChromaDB"] }),
  S("otheragents", "CrewAI / AutoGen / Semantic Kernel / DSPy", ["crewai", "crew ai", "autogen", "semantic kernel", "dspy", "haystack"], false, { via: ["LangGraph", "LangChain"] }),
  S("mlflow", "MLflow / experiment tracking", ["mlflow", "weights & biases", "weights and biases", "wandb", "experiment tracking"], false, { via: ["LangSmith"] }),
  S("mlops", "MLOps pipelines (Airflow / Kubeflow)", ["airflow", "kubeflow", "mlops", "ml pipelines"], false, { via: ["Docker", "GitHub Actions"] }),
  S("spark", "Spark / big data", ["spark", "pyspark", "hadoop", "big data", "databricks"], false, { via: ["pandas"] }),
  S("kafka", "Kafka / streaming", ["kafka", "kinesis", "pub/sub", "streaming data"], false),
  S("warehouse", "Snowflake / data warehouses", ["snowflake", "redshift", "data warehouse"], false, { via: ["SQL"] }),
  S("terraform", "Terraform / IaC", ["terraform", "infrastructure as code", "iac", "cloudformation"], false),
  S("ts", "JavaScript / TypeScript", ["javascript", "typescript", "node.js", "nodejs"], false),
  S("react", "React / frontend", ["reactjs", "react.js", "react native", "next.js", "nextjs", "frontend", "front-end"], false),
  S("go", "Go", ["golang"], false),
  S("rust", "Rust", ["rust"], false),
  S("cpp", "C++ / CUDA", ["c++", "cuda", "triton kernels"], false),
  S("optimize", "Inference optimization (TensorRT / ONNX / quantization)", ["tensorrt", "onnx", "quantization", "distillation", "triton inference"], false, { via: ["vLLM", "QLoRA"] }),
  S("distributed", "Distributed training (DeepSpeed / FSDP)", ["deepspeed", "fsdp", "distributed training", "multi-gpu", "megatron"], false, { via: ["QLoRA / PEFT"] }),
  S("rlhf", "RLHF / DPO / preference tuning", ["rlhf", "dpo", "reinforcement learning from human feedback", "preference tuning", "reward model"], false, { via: ["Fine-tuning (LoRA / QLoRA)"] }),
  S("rl", "Reinforcement learning", ["reinforcement learning"], false),
  S("cv", "Computer vision", ["computer vision", "opencv", "yolo", "image classification", "object detection", "cnn", "cnns", "vision models"], false, { via: ["PyTorch", "Deep learning"] }),
  S("speech", "Speech / ASR / TTS", ["speech recognition", "asr", "whisper", "text-to-speech", "tts"], false),
  S("graph", "Knowledge graphs / Neo4j", ["knowledge graph", "knowledge graphs", "neo4j", "graphrag", "graph rag"], false, { via: ["RAG"] }),
  S("monitoring", "Prometheus / Grafana", ["prometheus", "grafana", "datadog"], false, { via: ["LangSmith"] }),
  S("microservices", "Microservices", ["microservices", "microservice"], false, { via: ["FastAPI", "Docker"] }),
  S("graphql", "GraphQL", ["graphql"], false, { via: ["REST APIs"] }),
  S("bi", "Tableau / Power BI", ["tableau", "power bi", "looker"], false),
  S("abtest", "A/B testing & experimentation", ["a/b testing", "a/b test", "ab testing"], false),
  S("scala", "Scala", ["scala"], false),
];

const ALL = [...HAVE, ...GAPS];

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const compiled = ALL.map((s) => ({
  skill: s,
  res: s.aliases.map((a) => new RegExp(`(^|[^a-z0-9+#])${esc(a.toLowerCase())}([^a-z0-9+#]|$)`, "i")),
}));

export type FitItem = { skill: Skill; evidence: string[]; via?: string[] };
export type FitNote = { label: string; status: "ok" | "warn" | "info"; detail: string };
export type FitReport = {
  role: string;
  score: number;
  verdict: string;
  matched: FitItem[];
  transferable: FitItem[];
  missing: FitItem[];
  notes: FitNote[];
  found: number;
  ms: number;
};

const titleOf = (id: string) => projects.find((p) => p.id === id)?.title ?? id;

function detectRole(jd: string) {
  const first = jd
    .split(/\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 2 && l.length < 90);
  const m = jd.match(/\b((?:senior|sr\.?|junior|jr\.?|lead|staff|principal|associate)?\s*(?:gen\s?ai|generative ai|ai|ml|machine learning|llm|nlp|data|applied|research|mlops|software|backend|security)[\w\s/&-]{0,30}?(?:engineer|scientist|developer|architect|researcher))\b/i);
  return (m?.[1] ?? first ?? "this role").replace(/\s+/g, " ").trim();
}

export function analyzeJD(jd: string): FitReport {
  const t0 = performance.now();
  const text = ` ${jd.toLowerCase().replace(/[“”]/g, '"')} `;

  const found = compiled.filter(({ res }) => res.some((r) => r.test(text))).map((c) => c.skill);
  const matched: FitItem[] = [];
  const transferable: FitItem[] = [];
  const missing: FitItem[] = [];

  for (const skill of found) {
    if (skill.have) matched.push({ skill, evidence: (skill.evidence ?? []).map(titleOf) });
    else if (skill.via?.length) transferable.push({ skill, evidence: [], via: skill.via });
    else missing.push({ skill, evidence: [] });
  }

  const weight = (s: Skill) => (s.core ? 1.5 : 1);
  const total = found.reduce((a, s) => a + weight(s), 0);
  const got =
    matched.reduce((a, m) => a + weight(m.skill), 0) + transferable.reduce((a, m) => a + weight(m.skill) * 0.4, 0);
  const score = total ? Math.round((got / total) * 100) : 0;

  const notes: FitNote[] = [];
  const yrs = [...jd.matchAll(/(\d+(?:\.\d+)?)\s*\+?\s*(?:-|to|–)?\s*(\d+)?\s*\+?\s*(?:years|yrs)/gi)].map((m) => parseFloat(m[1]));
  if (yrs.length) {
    const need = Math.min(...yrs);
    notes.push(
      need <= 1.5
        ? { label: "Experience", status: "ok", detail: `JD asks for ${need}+ years. He has 1.5+ years building production GenAI.` }
        : {
            label: "Experience",
            status: "warn",
            detail: `JD asks for ${need}+ years. He has 1.5+ years of production GenAI experience, with depth across 10 AI/ML systems.`,
          },
    );
  }
  if (/\b(ph\.?d|doctorate)\b/i.test(jd))
    notes.push({ label: "Degree", status: "warn", detail: `JD mentions a PhD. He holds a ${education.degree.split(" — ")[0]} (CGPA 8.0).` });
  else if (/\b(master'?s|m\.s\.|m\.tech|msc)\b/i.test(jd) && !/bachelor/i.test(jd))
    notes.push({ label: "Degree", status: "warn", detail: `JD mentions a Master's. He holds a ${education.degree.split(" — ")[0]}.` });
  else if (/\b(bachelor'?s|b\.?tech|b\.?e\.?|degree in|computer science)\b/i.test(jd))
    notes.push({ label: "Degree", status: "ok", detail: `${education.degree}, ${education.school}.` });
  if (/\bremote\b/i.test(jd)) notes.push({ label: "Location", status: "ok", detail: `Remote role. He's in ${profile.location} (IST).` });
  else if (/hyderabad/i.test(jd)) notes.push({ label: "Location", status: "ok", detail: `Hyderabad role. He's based in ${profile.location}.` });
  else if (/\b(onsite|on-site|relocat\w*|hybrid(?!\s+search))\b/i.test(jd))
    notes.push({ label: "Location", status: "info", detail: `He's based in ${profile.location}. Ask him about relocation or hybrid work.` });

  const verdict =
    found.length < 4
      ? "Paste a fuller JD for a reliable score"
      : score >= 80
        ? "Strong match"
        : score >= 60
          ? "Good match"
          : score >= 40
            ? "Partial match"
            : "Limited match";

  // Core skills first
  const byCore = (a: FitItem, b: FitItem) => Number(!!b.skill.core) - Number(!!a.skill.core);
  matched.sort(byCore);

  return { role: detectRole(jd), score, verdict, matched, transferable, missing, notes, found: found.length, ms: performance.now() - t0 };
}

export function reportToText(r: FitReport) {
  return [
    `${profile.name}: fit for "${r.role}"`,
    `Skill match: ${r.score}% (${r.verdict})`,
    `Matched (${r.matched.length}): ${r.matched.map((m) => m.skill.label).join(", ") || "none"}`,
    `Transferable (${r.transferable.length}): ${r.transferable.map((m) => `${m.skill.label} ← ${m.via?.join(", ")}`).join("; ") || "none"}`,
    `Gaps (${r.missing.length}): ${r.missing.map((m) => m.skill.label).join(", ") || "none"}`,
    ...r.notes.map((n) => `${n.label}: ${n.detail}`),
    `Contact: ${profile.email} · ${profile.socials.linkedin}`,
  ].join("\n");
}

export const sampleJDs: { label: string; text: string }[] = [
  {
    label: "GenAI Engineer",
    text: `Generative AI Engineer (Hyderabad / Hybrid)

We're looking for an engineer with 1+ years of experience building LLM applications in production.

Responsibilities
- Build RAG pipelines and AI agents using LangChain or LangGraph
- Work with OpenAI, Anthropic Claude and Gemini APIs; design prompts and structured outputs
- Own embeddings, vector databases (Pinecone, Weaviate) and hybrid search with re-ranking
- Set up LLM evaluation and guardrails to reduce hallucinations
- Ship services with Python, FastAPI and Docker on AWS

Nice to have: fine-tuning with LoRA/QLoRA, Kubernetes, MLflow.
Bachelor's degree in Computer Science or related field.`,
  },
  {
    label: "AI Security Engineer",
    text: `AI Security Engineer (Remote)

Help us secure LLM-powered products against prompt injection, jailbreaks and data leakage.

- Build guardrails and an LLM security gateway for agents with tool calling
- Run red teaming and adversarial testing aligned with the OWASP Top 10 for LLMs
- Detect PII leakage and unsafe tool use; benchmark false positives and latency
- Background in cybersecurity (SIEM, threat intelligence, MITRE ATT&CK) is a plus
- Python, FastAPI, Docker; experience with Go or Rust is a bonus
3+ years of experience in security or ML engineering.`,
  },
  {
    label: "ML Platform Engineer",
    text: `Senior Machine Learning Engineer, ML Platform

5+ years of experience. Master's degree preferred.

- Design training and serving infrastructure for deep learning models (PyTorch, TensorFlow)
- Distributed training with DeepSpeed, model optimization with TensorRT and ONNX
- Build MLOps pipelines with Airflow and Kubeflow on Kubernetes, tracked with MLflow
- Data processing with Spark and Kafka; deploy on GCP (Vertex AI) and AWS SageMaker
- Strong Python and C++; experience with model serving (vLLM, Triton)`,
  },
];
