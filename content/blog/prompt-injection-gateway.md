---
title: "Building a prompt-injection gateway for LLM agents (draft)"
date: 2026-11-04
summary: "Draft outline: what I built, how I tested it with an automated red-teaming agent, and what the benchmarks showed."
tags: [LLM security, OWASP, LangGraph]
draft: true
---

> Draft. Drafts show only in `npm run dev` and are never published. Replace the TODOs with your own words and numbers, then set `draft: false`.

## The problem

LLM agents with tools can be steered by text they read: direct prompt injection, indirect injection inside retrieved documents, jailbreaks, PII leakage and unsafe tool calls.

## What I built

- A guardrail gateway that inspects requests and tool calls in real time.
- An OpenAI-compatible API, shipped as a Dockerized FastAPI service, so clients only change the base URL.
- TODO: describe the detectors and the policy engine (allow / redact / block).

## Red-teaming it automatically

- A LangGraph agent generates direct and indirect prompt-injection attacks mapped to the OWASP Top 10 for LLM Applications.
- TODO: how attacks were generated, how many, and which categories were hardest.

## Results

| Metric | Without gateway | With gateway |
| --- | --- | --- |
| Attack success rate | TODO | TODO |
| False-positive rate | TODO | TODO |
| Added latency (p50 / p95) | TODO | TODO |

## What I'd do differently

TODO
