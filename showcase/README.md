# Showcase kits

Raw material for the project detail pages (`site/projects/<slug>.html`).
This folder is **not deployed**; only `site/` is. Images are optimised and copied into
`site/assets/projects/<slug>/` when a page is built.

One folder per project:

```
showcase/<slug>/
├── project.md            facts, write-up and screenshot captions (template below)
├── screenshots/          PNG, 1600×1000 browser viewport at 100% zoom, named 01-*.png, 02-*.png …
└── terminal/             plain-text captures of real CLI runs, named 01-*.txt …
                          (the site renders these in its own terminal style, so don't screenshot terminals)
```

Rules
- Only real output from actually running the project. No mock-ups, no edited numbers.
- No secrets in any screenshot or text: API keys, tokens, passwords, `.env` contents, private IPs, personal emails.
- Every metric in `project.md` names the file or command it came from.

## `project.md` template

```markdown
---
slug: geospatial-foundry
title: Geospatial Intelligence Foundry
tagline: One sentence, under 120 characters.
years: 2024–2025
role: Solo / team of N — what I did
status: Prototype | Production | Archived
repo: https://github.com/...
stack: [Python, Memgraph, ...]
---

## Overview
2–3 short paragraphs: what it is, who it's for, why it exists.

## How it works
The architecture in plain words, step by step. Name the components and how data flows.

## Features
- One line each, 4–8 items.

## Results
- Metric — value — source file/command

## Challenges and decisions
- 2–4 items: a real problem, what was decided, why.

## Run it
Exact commands that worked, in order.

## Screenshots
- 01-xxx.png — caption (what the viewer is looking at, one sentence)
- 02-xxx.png — caption

## Terminal captures
- 01-xxx.txt — caption
```
