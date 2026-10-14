---
slug: zonny001
title: Zonny001
tagline: A local multi-agent coding platform where six AI agents turn one prompt into a web app, entirely on your own machine.
years: 2024–2025
role: Solo project: design, agents, server, web IDE and MCP server
status: Working prototype
repo: https://github.com/Krupa1316/Zonny001
stack: [Python, FastAPI, AutoGen, Ollama, ChromaDB, sentence-transformers, MCP, Monaco, xterm.js]
diagram: zonny001
---

## Overview
Zonny is an AI development platform that runs entirely on local hardware. Language models are served by Ollama, so there are no cloud APIs, no subscriptions and no code leaving the machine.

Its centrepiece is a "Software Company": type a prompt such as *Build a Pomodoro timer app* and six specialised agents plan, build and review the application. Around it sits a browser IDE (Monaco editor, file explorer, terminal and live preview), a routed chat assistant, a CLI, a REST API and an MCP server, so Claude Desktop can use Zonny's tools.

## How it works
1. **Company pipeline.** Six AutoGen agents run in a fixed order: the **CEO** writes requirements, the **Architect** designs the system and file layout, the **Frontend** and **Backend** engineers write code, **QA** reviews it and the **Reviewer** signs off with a ship report.
2. **File extraction.** Code is pulled out of agent messages using `// FILE: name.ext` markers and written to a per-session folder, which the IDE and preview read from.
3. **Auto-repair.** The preview reports JavaScript errors back to the server. The two engineer agents get the current files plus the errors and return fixes, up to 3 attempts.
4. **Chat.** A router sends each question to a specialist (general, code, docs or memory), and an assistant agent turns the specialist's analysis into the final answer.
5. **Tools and safety.** Agents act through a registry of 17 tools behind a dispatcher that blocks path traversal and sensitive file types, under three permission modes: safe, dev and full.
6. **Memory.** ChromaDB stores embeddings per session and per agent, so the code agent can't see the docs agent's memories and sessions don't leak into each other.

## Features
- One prompt → requirements, architecture, frontend and backend code, QA review and a ship report
- Live pipeline view showing which agent is working, plus generated files appearing as they're written
- Browser IDE: Monaco editor, file explorer, xterm.js terminal and in-app preview
- Auto-repair loop for runtime errors (max 3 attempts)
- MCP server exposing 7 tools to Claude Desktop and other MCP clients
- Three permission tiers; `.exe`, `.dll`, `.env`, `.key` and `.pem` writes are always blocked
- 35-check diagnostic suite (`zonny_status.py`)

## Results
- Diagnostics: 35/35 checks passed, including the 17-tool registry, router, dispatcher security and reflection loop. Source: `python zonny_status.py`, see the capture below
- Full company run for *Build a Pomodoro timer app*: all six agents completed in about 21 minutes on CPU with Mistral 7B, saving 7 files (`index.html` and six React components/utilities). Source: the run shown in the screenshots

## Challenges and decisions
- **Local-first by design.** Everything runs through Ollama, trading raw model quality for privacy and zero running cost. With a 7B model, the agents' plan was more ambitious than the code they produced: the ship report listed about 30 files but 7 were saved, and the preview didn't render because `index.html` referenced a bundle that was never written. Larger coding models (the default is `deepseek-coder:33b`) close that gap.
- **Agents never see raw tool names.** The router returns an agent and a natural-language task, not a tool call, and a dispatcher validates every action. Hallucinated tools such as `workspace.search` are rejected; the diagnostics test for exactly this.
- **Memory isolation.** Memory is scoped by session and by agent, so specialists stay focused and sessions don't bleed into each other.

## Run it
```
ollama pull nemotron-3-nano:latest
ollama pull deepseek-coder:33b
pip install -r requirements.txt
python create_key.py
uvicorn server:app --host 0.0.0.0 --port 8000
```
Then open http://localhost:8000, paste the key into Settings and use the **Company** tab.

## Note on these captures
Captured on 14 Oct 2026 on a Windows laptop with **Mistral 7B** in place of the default models, running on CPU. This PC's Windows Application Control policy blocks PyTorch, so the embedding-based memory was switched off for the capture. Everything else is the unmodified project.

## Screenshots
- 01-ceo-spec.png — The CEO agent turns "Build a Pomodoro timer app" into a product goal, six core features, a tech stack and a file plan.
- 02-architect.png — The Architect takes over and designs the system, while the pipeline at the top tracks which agent is working.
- 03-engineers-writing-code.png — The Frontend and Backend engineers write the code; each file appears in the Generated Files panel as it's saved.
- 04-shipped.png — All six stages done: the Reviewer's ship report and the seven generated files.
- 05-agent-roster.png — The Chat tab with its roster of 11 agents and the local model each one runs on.
- 06-ide.png — The browser IDE: file explorer with the generated project, Monaco editor and terminal panel.

## Terminal captures
- 01-diagnostics.txt — The 35-check diagnostic suite: Ollama, the 17-tool registry, the router and the dispatcher's security rules.
