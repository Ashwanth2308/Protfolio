---
title: How the AI on this site runs without an API key
date: 2026-11-05
summary: The assistant, the fit check and the nine AI Lab playgrounds all run in your browser. Here is how they work, and where an LLM would still do better.
tags: [RAG, BM25, LLM security, Evals]
draft: false
---

By default, every AI feature on this portfolio runs in the visitor's browser. There is no model API behind the chat, no server receiving what you type, and no key to leak. I built it that way on purpose: a portfolio should be cheap to host, private for visitors, and impossible to run up a bill on.

## The assistant is a small RAG system

"Ask my AI" follows the same shape as the retrieval systems I build at work, just with a lighter retriever.

1. **Knowledge base.** The page content (projects, roles, skills, education) is turned into about thirty chunks, each with a written answer.
2. **Tokenize and expand.** A question is lowercased, stripped of stopwords and lightly stemmed, then expanded with synonyms. Expanded terms count less (×0.45) than the words you actually typed.
3. **Retrieve with BM25.** Okapi BM25 scores every chunk, with a boost for terms that appear in a chunk's title or keywords.
4. **Confidence gate.** If the best score is below a threshold, the assistant says it doesn't know instead of guessing.
5. **Answer with sources.** The best chunk's answer is returned with links to the sections it came from, and "How I answered" shows the scores.

A few intents (greetings, "why should we hire him?", hiring questions) are routed before retrieval, and a `skill_lookup` tool answers "does he know X?" directly from the skills list.

## The guardrail is rules, on purpose

The guardrail playground scans text for prompt injection, jailbreak personas, system-prompt extraction, secrets and personal data, unsafe tool calls and base64-smuggled instructions. Each finding maps to a category in the OWASP Top 10 for LLM Applications, and the gateway either allows, redacts or blocks.

It is pattern matching, and the page says so. Rules are fast and explainable, but they miss paraphrased attacks. A production gateway layers classifiers, policies and tool-call inspection on top, and it gets measured on attack success rate, false-positive rate and latency.

## Grounding beats fluency

The hallucination checker applies a rule I use for compliance work: every claim needs evidence. Each sentence of an answer must be covered by one or two source sentences, and every number and name must appear in the source. It catches "thirty minutes" when the source says fifteen, and it catches a job at a company the source never mentions.

## Where an LLM still wins

Keyword retrieval cannot handle questions phrased in words the knowledge base never uses, and templated answers cannot combine facts the way a model can. For that, the site can optionally call Claude through a small server function. It keeps the same guardrail in front, retrieves context first, tells the model to answer only from that context, and caps tokens and requests per day. If the function is not configured, or fails, the assistant falls back to the local version.

## Try it

Open the [AI Lab](../../#lab) and run the agent workbench, or paste a job description into the [fit check](../../#fit). Nothing you type leaves the page.
