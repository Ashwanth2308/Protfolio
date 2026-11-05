---
title: "Fine-tuning a 7B model to write Sigma rules (draft)"
date: 2026-11-03
summary: "Draft outline: QLoRA on synthetic log/rule pairs, an execution-based eval harness, and a cost/latency comparison with a frontier API."
tags: [Fine-tuning, QLoRA, Evals, Detection engineering]
draft: true
---

> Draft. Drafts show only in `npm run dev` and are never published. Replace the TODOs with your own words and numbers, then set `draft: false`.

## Why fine-tune

TODO: why a small open model was worth trying for detection-rule generation.

## Data

- Synthetic attack-log and Sigma-rule pairs.
- TODO: how many pairs, how they were generated and checked.

## Training

- QLoRA on an open-source 7B model with Hugging Face Transformers and PEFT.
- TODO: base model, rank, epochs, hardware.

## Evaluation that executes the rules

Generated Sigma rules are run against held-out attack and benign logs, measuring detection rate and false positives instead of comparing text.

| Model | Detection rate | False positives | Cost / 1k rules | Latency |
| --- | --- | --- | --- | --- |
| Fine-tuned 7B (vLLM) | TODO | TODO | TODO | TODO |
| Frontier API | TODO | TODO | TODO | TODO |

## Serving

Served with vLLM behind FastAPI. TODO: throughput and memory notes.

## What I'd do differently

TODO
