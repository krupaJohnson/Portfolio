# Prompt for the agent on the Geospatial Foundry PC

Copy everything below the line into the agent (Claude Code or similar) on the PC where
Geospatial Foundry runs.

---

You are helping me build a showcase page for my project **Geospatial Intelligence Foundry** on my
portfolio site (https://johnson.kolli.in). Your job is to run the project on this machine, capture
real screenshots and terminal output, and write up the project accurately. You will deliver a
"showcase kit" folder in an exact format, pushed to my portfolio repo on a new branch.

## Ground rules
- **Do not change the project's source code** and do not commit or push anything to the project's own
  repository. Read-only use of the project, apart from running it.
- **Only real output.** Every screenshot and number must come from actually running the project on
  this machine. No mock-ups, no edited or invented numbers. If something doesn't work, say so in your
  notes instead of faking it.
- **No secrets anywhere** in screenshots or text: API keys (including any `ANTHROPIC_API_KEY`), tokens,
  passwords, `.env` contents, MinIO credentials, private IP addresses, personal emails. Crop or re-take
  if any appear.
- Ask me before installing anything system-wide or deleting data/volumes.

## 1. Understand the project
The project is at `<PATH TO GeospacialFoundry ON THIS PC>` (also on GitHub:
https://github.com/Krupa1316/GeospacialFoundry). Read `foundry/README.md`, `foundry/CHANGELOG.md`,
`foundry/docs/*.md`, `docker-compose.yml`, `foundry/api/main.py` and the routers, and skim
`foundry/core/` (pipeline, classifier, governance, audit, rollback, rescue) and `foundry/monitors/`.
Summarise for yourself: what the ontology engine decides (extend / create / merge / quarantine), the
rules → ML → LLM escalation, the 5 stores (Memgraph, TimescaleDB, Qdrant, Redis, MinIO) and what
each holds, the monitors (cascade guard, ghost guard, source monitor), and the AIS connectors.

## 2. Run it
1. Start the stack with `docker compose up -d` and wait until every service is healthy
   (`docker compose ps`). Run the health check script (`scripts/health_check.py` or
   `foundry/scripts/health_check.py`).
2. Seed and run the pipeline using the project's own scripts, for example `setup_hypertables.py`,
   `seed_ontology.py`, `generate_synthetic_dataset.py`, `demo_e2e.py`. Use the README's order if it
   gives one.
3. Start the API (`foundry/scripts/run_api.py` or `uvicorn`) and confirm the static pages load:
   `/static/platform_dashboard.html` and `/static/earth_view.html` (check `main.py` for exact paths).
4. Run a few scenario scripts that show the system's behaviour: `simulate_conflict.py`,
   `simulate_cascade.py`, `simulate_ghost.py`, `simulate_rollback.py`, `simulate_rescue.py`,
   `simulate_source_death.py`, and `run_drift_scenarios.py`.
5. If a metrics/evaluation script runs in reasonable time (`compute_metrics.py`, `run_paper_eval.py`),
   run it. Otherwise use the latest existing files in `foundry/reports/`.

## 3. Capture screenshots
Browser window with a **1600×1000 viewport at 100% zoom**, light theme where there's a choice.
Save as PNG, numbered in the order a visitor should see them. Aim for **6–10 strong screenshots**:
- `01-platform-dashboard.png`: the platform dashboard with live data in it
- `02-earth-view.png`: the earth/map view showing entities or AIS tracks
- `03-ontology-graph.png`: Memgraph Lab (usually http://localhost:3000) showing part of the ontology
  graph. Run a Cypher query that gives a readable picture (around 30–80 nodes, labelled) rather than
  a hairball.
- `04-api-docs.png`: FastAPI `/docs` with the routers expanded (geo, live, ontology, system)
- `05-…`: anything else that shows a decision being made or audited, e.g. an audit-trail view, a
  quarantine/merge result, a drift or rollback event in a UI, Qdrant's dashboard with the collection,
  or a TimescaleDB query result in a GUI.

Make each one tell one thing. Close dev tools and hide bookmarks bars and notifications.

## 4. Capture terminal output as text (not screenshots)
For CLI runs, save the **real output as plain-text files** in `terminal/`, trimmed to the interesting
part (max ~40 lines each, keep the command line at the top as `$ <command>`). Strip ANSI colour
codes. Good candidates:
- `01-health-check.txt`: all services healthy
- `02-demo-e2e.txt`: the end-to-end demo
- `03-simulate-conflict.txt`, `04-simulate-cascade.txt`, `05-rollback.txt`: decisions, guards and
  rollback in action
- `06-metrics.txt`: the evaluation/metrics summary

## 5. Write `project.md`
Use exactly this structure. Keep it factual and specific. Every claim should be checkable in the code
or the output you captured, and every number names its source file or command.

```markdown
---
slug: geospatial-foundry
title: Geospatial Intelligence Foundry
tagline: <one sentence, under 120 characters>
years: 2024–2025
role: <solo or team, and what Kolli built>
status: Prototype
repo: https://github.com/Krupa1316/GeospacialFoundry
stack: [Python, FastAPI, Memgraph, TimescaleDB, PostGIS, Qdrant, Redis, MinIO, Prefect, sentence-transformers, Docker]
---

## Overview
## How it works
## Features
## Results
## Challenges and decisions
## Run it
## Screenshots
- 01-platform-dashboard.png — <one-sentence caption>
## Terminal captures
- 01-health-check.txt — <one-sentence caption>
```

Section guidance:
- **Overview**: 2–3 short paragraphs: what it is, the problem (keeping a geospatial ontology
  correct as new, messy data arrives), who it's for.
- **How it works**: the pipeline step by step: ingestion (AIS connectors) → classification
  (rules → ML → LLM escalation) → governance decision (extend/create/merge/quarantine) → storage
  across the 5 stores → monitors and audit/rollback. Say what each store is used for.
- **Results**: only real numbers from `foundry/reports/` or your runs (e.g. accuracy, decision
  distribution, latency, drift detection, ablation results), each with its source file.
- **Challenges and decisions**: 2–4 real design decisions visible in the code or docs (e.g. why 5
  stores, why escalate to an LLM only after rules and ML, how ghost/cascade guards work).
- Also copy the two architecture diagrams from the repo root (`foundry_complete_data_structures.svg`,
  `foundry_complete_storage_and_stack.svg`) into `diagrams/`.

## 6. Deliver
Final folder layout:

```
geospatial-foundry/
├── project.md
├── screenshots/01-….png …
├── terminal/01-….txt …
└── diagrams/*.svg
```

Push it to my portfolio repo on a new branch:

```bash
git clone https://github.com/krupaJohnson/Portfolio.git
cd Portfolio
git checkout -b showcase/geospatial-foundry
mkdir -p showcase/geospatial-foundry
# copy the kit into showcase/geospatial-foundry/
git add showcase/geospatial-foundry
git commit -m "Add Geospatial Foundry showcase kit"
git push -u origin showcase/geospatial-foundry
```

Only add files under `showcase/geospatial-foundry/`. Don't touch anything else in that repo,
especially `site/`. If you can't push (no access on this PC), zip the `geospatial-foundry` folder
and tell me where it is.

When you finish, reply with: what ran successfully, what didn't (and why), the list of screenshots
and terminal files with captions, and anything you were unsure about.
