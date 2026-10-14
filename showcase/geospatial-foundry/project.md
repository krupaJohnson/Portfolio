---
slug: geospatial-foundry
title: Geospatial Intelligence Foundry
tagline: A governance-first ontology engine that safely evolves its own schema as live aircraft, ship, earthquake and satellite data streams in.
years: 2024–2025
role: Solo research project: architecture, ingestion connectors, classification pipeline, safety monitors, API, dashboards and evaluation
status: Research prototype
repo: https://github.com/Krupa1316/GeospacialFoundry
stack: [Python, FastAPI, Memgraph, TimescaleDB, PostGIS, Qdrant, Redis, MinIO, Prefect, sentence-transformers, Cesium, Docker]
---

## Overview
Real-world data streams change shape constantly. A feed adds a field, renames one, or starts sending text where it used to send numbers. Foundry is an ontology engine that keeps a knowledge graph of *what kinds of things exist* (aircraft, vessels, events, locations, organisations) correct as that messy data arrives, and evolves the schema automatically **without** silently corrupting it.

Every schema change is justified with evidence and a confidence score, checked by safety monitors, written to an audit trail with its provenance, and reversible. It ingests live aviation (ADS-B), maritime (AIS), USGS earthquake, satellite (CelesTrak) and conflict (GDELT) feeds and plots them on a 3D globe.

## How it works
1. **Observe.** Connectors pull records from each live source on a schedule.
2. **Fingerprint.** Each field is classified (type, semantic tag such as `spatial.lat` or `identifier`, and confidence) by a tiered classifier: fast rules first, a small ML model next, and an LLM only for the hard cases, asynchronously and never on the hot path.
3. **Score.** The record's fields are compared structurally and semantically against every class in the ontology, using the embeddings stored in Qdrant.
4. **Decide.** The overlap score maps to a boundary decision: **merge** (≥ 0.85), **extend** an existing class (≥ 0.70), **quarantine** (0.35–0.70) or **create** a new class (< 0.35).
5. **Guard.** The Ghost Guard retires auto-created classes that never get real observations, the Cascade Guard stops risky changes to parent classes from propagating to children, and the Source Monitor flags connectors that go silent.
6. **Apply or quarantine.** Safe changes are written to the Memgraph ontology. Ambiguous or conflicting payloads are rescued to MinIO as raw JSON, so nothing is ever discarded.
7. **Audit and roll back.** Every change is an event in TimescaleDB with `before_state`, `after_state` and provenance. Any event can be rolled back, which writes a rollback event of its own.

Each of the five stores has one job: Memgraph holds the ontology graph, TimescaleDB with PostGIS holds the audit trail and position history, Qdrant holds the class and property embeddings, Redis is the cache and stream buffer, and MinIO is the rescue bucket.

## Features
- Self-extending ontology: classes and typed, semantically tagged properties with confidence scores
- Four boundary decisions with explicit thresholds, every one auditable
- Quarantine and rescue: conflicting data is preserved in MinIO, never dropped
- Safety monitors for ghost classes, cascade changes and dead sources, plus one-step rollback
- Live connectors for aviation, maritime, earthquakes, satellites and conflict events
- Platform dashboard, Cesium 3D Earth view, and a FastAPI service with 4 routers (system, ontology, geo, live)
- Reproducible evaluation on a frozen, SHA-256-pinned 190-event benchmark with ablations

## Results
- **Accuracy:** the full model reaches 84.2% on the 190-event benchmark, against 34.2% for the always-extend and always-create baselines (+50 points). Source: `run_paper_eval.py`, see the capture below
- **Quarantine matters:** removing it drops accuracy to 52.6% (−31.6 points); the aggressive and conservative threshold variants score 63.2% and 57.9%. Source: same run
- **Safety simulations against the live stores:** type conflict (rescued to MinIO, audit rows 214 → 215), unknown-field rescue, cascade warning, ghost-class retirement, rollback and dead-source detection with recovery all passed. Source: `simulate_*.py`, see the capture below
- **Live audit trail (last 30 days):** 90 automatic events, 53 quarantined with a 0% escape rate, and a 1.11% rollback rate. Source: `compute_metrics.py`
- **Health:** all 5 stores live and 4/4 API smoke checks passing. Source: `health_check.py`, `api_smoke.py`

## Challenges and decisions
- **Five specialised stores instead of one database.** Graph traversal, time-series plus geospatial queries, vector similarity, caching and raw blob storage each go to the tool built for them, so every store does one job. The architecture diagram below records the alternatives that were considered and rejected.
- **Escalate only when needed.** Rules handle most fields, a small model handles the rest, and an LLM is called asynchronously only for genuinely ambiguous cases. This keeps ingestion fast and cheap.
- **Honest limitations from this run.** Provenance is complete for only 2.2% of live audit rows, even though the offline demo shows 100%. The benchmark has no *merge* labels, yet the model predicted 15 merges. "Structural only" scores the same as the full model, so the semantic layer's added value isn't shown on this benchmark yet. These are the next things to fix.

## Run it
```
docker compose -f foundry/docker-compose.yml up -d
pip install -r foundry/requirements.txt
cd foundry
python scripts/health_check.py
python scripts/seed_ontology.py
python scripts/run_api.py
```

## Note on these captures
Captured on 14 Oct 2026 on a separate Windows 11 machine with Docker Desktop and Python 3.13, with all six containers healthy. The only edit is the database password in screenshot 01, masked as `***`. The Zyte source shows "error" because no API key was configured, and the GDELT conflict feed returned no points during this run. `demo_e2e.py` is a scripted walkthrough that doesn't write to the databases; the safety simulations and metrics ran against the live stores.

## Diagrams
- foundry_complete_storage_and_stack.svg — Storage architecture: each of the five stores, the alternatives considered and why each was chosen, plus the full tech stack.
- foundry_complete_data_structures.svg — Core data structures: every field of ClassNode, PropertyDescriptor and RelationshipEdge, and the failure mode it exists to handle.

## Screenshots
- 03-ontology-graph.png — The ontology in Memgraph Lab: 6 classes (red) with their properties, linked by relationships such as EXTENDS, OCCURRED_AT, FLEW_OVER and REGISTERED_TO.
- 01-platform-dashboard.png — The platform dashboard: all five stores healthy, 914 ontology change events, recent automatic changes, and the live sources feeding the system.
- 02-earth-view.png — The live Earth view in Cesium, plotting real aircraft, vessels, earthquakes and satellites, next to the ontology activity feed.
- 04-api-docs.png — The FastAPI service with its four routers: system, ontology engine, geospatial tracking and live sources.
- 05-api-live-audit-query.png — A live query of the audit trail: each change event carries its before and after state and its provenance.
- 06-qdrant-embeddings.png — Qdrant's ontology_embeddings collection: 768-dimensional embeddings for each class, with metadata used for filtering.

## Terminal captures
- 06-paper-eval.txt — The evaluation on the frozen 190-event benchmark: full model against baselines and ablations.
- 04-safety-simulations.txt — Safety simulations against the live stores: conflict rescue, cascade and ghost guards, rollback and dead-source recovery.
- 07-live-metrics.txt — Metrics from the live audit trail: rollback rate, quarantine escapes, provenance and decision distribution.
- 02-query-ontology.txt — The current ontology: classes, typed properties, semantic tags and confidences.
- 03-demo-e2e-walkthrough.txt — A scripted, offline walkthrough of the 10-step governance loop (it doesn't write to the databases).
- 01-health-check.txt — All six containers healthy and all five stores live.
- 05-api-smoke.txt — API smoke test: 4/4 endpoints return 200.
