# Geospatial Intelligence Foundry: run proof

Captured 2026-10-14 by running the project locally (Windows 11, Docker Desktop, Python 3.13 venv).
Stack: `foundry/docker-compose.yml`, which runs Memgraph, TimescaleDB, Qdrant, Redis, MinIO and the FastAPI service. All six were healthy.
Every screenshot is 1600×1000 and comes from the running system. The only edit is in 01, where the DB password in the TimescaleDB DSN is masked as `***`.

## Screenshots
| File | What it shows |
|---|---|
| 01-platform-dashboard.png | All 5 stores report OK. The audit trail holds 900+ change events. Live feeds return 78 mapped points (aviation, maritime/AIS, USGS events, satellites). |
| 02-earth-view.png | Cesium globe plotting real aircraft, vessels, earthquakes and satellites. The side panel shows the ontology activity (schema_drift, rollback, class_added, …) written by the simulations. |
| 03-ontology-graph.png | Memgraph Lab, `MATCH (n)-[r]->(m) RETURN n,r,m`: the 6 classes (red) with their 35 properties, plus the EXTENDS, OCCURRED_AT, FLEW_OVER and REGISTERED_TO relationships. |
| 04-api-docs.png | FastAPI `/docs` with the four routers: System, Ontology Engine, Geospatial Tracking, Live Sources. |
| 05-api-live-audit-query.png | `GET /api/v1/ontology/changes` run live. It returns audit events with `before_state` / `after_state` / `_provenance` from TimescaleDB. |
| 06-qdrant-embeddings.png | Qdrant `ontology_embeddings` collection: 768-dim class embeddings with payloads (363 points). |

## Terminal captures
| File | What it shows |
|---|---|
| 01-health-check.txt | `docker compose ps` (all healthy) plus `health_check.py`, with all 5 stores LIVE. |
| 02-query-ontology.txt | Current ontology in Memgraph: classes, typed properties, semantic tags, confidences. |
| 03-demo-e2e-walkthrough.txt | `demo_e2e.py`: a scripted, printed walkthrough of the 10-step governance loop. **It does not write to the databases** (`--live` only changes the label). |
| 04-safety-simulations.txt | The real proof, run against the live stores: type conflict (rows 214→215, payload rescued to MinIO), rescue of unknown fields, cascade guard warning, ghost guard, rollback (flag + rollback event), and source-death detection plus recovery. All PASS. |
| 05-api-smoke.txt | API smoke test: 4/4 endpoints return 200. |
| 06-paper-eval.txt | Ablation on the frozen 190-event benchmark (SHA-256 pinned). Full model 84.2% vs 34.2% for the baselines. Removing quarantine drops accuracy to 52.6% (−31.6 pp). |
| 07-live-metrics.txt | `compute_metrics.py` on the live audit trail (last 30 days): 90 auto events, 1.11% rollback rate, decision distribution. |

## Caveats seen in this run
- `run_drift_scenarios.py` did not finish within 10 min. Each record takes tens of seconds through the live pipeline. The latest earlier result is in `foundry/reports/drift_20260807_111641.json`.
- Live-DB provenance completeness came out at **2.2%** (`metrics_20261014_085740.md`). The offline demo prints 100%, but the real audit rows mostly lack the full provenance block.
- The benchmark has no `merge` labels, yet the model predicts 15 merges (per-class precision for merge = 0.000).
- "Structural only" scores the same as the full model (84.2%). The README discusses this as a known limitation.
- The Zyte live source shows `error` because no `ZYTE_API_KEY` is configured. The other 5 live sources returned data. The War/Conflict (GDELT) feed returned 0 points.
