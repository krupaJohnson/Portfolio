---
slug: zonnyhelper
title: ZonnyHelper
tagline: A one-command deploy CLI that scans any project, generates its deploy config and maps its code, with optional AI help for Git.
years: 2025–2026
role: Solo project: CLI design, deploy engine, code mapper, AI integrations, tests and PyPI release
status: Beta, published on PyPI
repo: https://github.com/Krupa1316/ZonnyHelper
pypi: https://pypi.org/project/zonny/
install: pip install zonny
stack: [Python, Typer, Rich, tree-sitter, Docker, Kubernetes, cloudflared, pytest]
---

## Overview
ZonnyHelper (`pip install zonny`) is a developer CLI for the boring half of shipping software: working out how a project should be deployed, writing the deploy config, keeping Git history tidy and understanding an unfamiliar codebase.

It's split into a deterministic core (`zonny-core`) that works offline with no API key, and an optional AI layer (`zonny-ai`) that plugs into Claude, OpenAI, Gemini or a local Ollama model.

## How it works
1. **Scan.** `zonny deploy scan` reads the project's manifests and source to detect the language, framework, entry point, port, build and start commands, databases and env vars, then ranks deploy targets. The profile is saved to `.zonny/deploy-profile.json`.
2. **Generate.** `zonny deploy generate --target <t>` turns the profile into config for any of 12 targets: Docker, docker-compose, Kubernetes, ECS Fargate, EC2, Lambda, Fly.io, Railway, Cloud Run, systemd, a plain process or Helm.
3. **Run and operate.** `run` deploys with live log streaming; `status`, `history` and `rollback` manage it afterwards. `cloudflare` publishes a running app through a Cloudflare Tunnel.
4. **Environment check.** `zonny deploy env` inspects the machine (Docker daemon, Kubernetes context, cloud CLIs and the tools present or missing) so the advice fits what's actually installed.
5. **Code map.** `zonny tree build` parses the repository with tree-sitter (falling back to regex) across 20 languages into an entity tree, which `export` writes as Markdown or Mermaid.
6. **AI Git.** `zonny git commit | pr | changelog | whybroke` write Conventional Commit messages, PR descriptions and changelogs, or diagnose a CI failure from its logs, using the provider you configure.

## Features
- Detects language, framework, port and env vars, and ranks the best deploy targets
- Generates deploy config for 12 targets, with run, status, history and rollback
- One-command public URL through Cloudflare Tunnels
- Code map of functions and classes across 20 languages, exported to Markdown or Mermaid
- AI Git workflow with Claude, OpenAI, Gemini or local Ollama, chosen by a provider priority order
- Core works fully offline; AI is an optional add-on package
- 402 automated tests

## Results
- Test suite: 402 passed. Source: `pytest -q`, see the capture below
- Code map of its own source: 831 entities. Source: `zonny tree build`, see the capture below
- 12 deploy targets. Source: `zonny deploy generate --help`

## Challenges and decisions
- **Deterministic first, AI second.** Scanning, generating and mapping never need an LLM, so the tool is fast, free and predictable. AI is reserved for judgment calls (commit messages, PR text, CI diagnosis) and lives in a separate package.
- **A profile file as the contract.** Every step reads and writes `.zonny/` files (`deploy-profile.json`, `deploy-plan.json`, `history.json`), so steps can be run, inspected or replaced independently.
- **Known gap.** The generated Docker config is a starting point, not yet production-ready. It's a strong first draft for simple apps.

## Run it
```
pip install zonny
cd your-project
zonny deploy scan
zonny deploy generate --target docker
zonny tree build
```

## Note on these captures
Captured on 14 Oct 2026 on Windows from the repository source. The deploy commands ran against a small Node/Express app; the code map ran on ZonnyHelper's own repository.

## Terminal captures
- 01-deploy-scan.txt — Scanning a Node/Express app: language, framework, entry point, port, commands and the best deploy targets.
- 02-deploy-generate.txt — Generating Docker deploy files from that profile.
- 03-deploy-env.txt — Checking the local environment: Docker daemon, Kubernetes context, and which deploy tools are present or missing.
- 04-tree-build.txt — Mapping ZonnyHelper's own codebase: 831 entities from its Python sources.
- 05-tree-export.txt — Exporting the code map to Markdown: every function and class with its file and line.
- 06-tests.txt — The full test suite.
