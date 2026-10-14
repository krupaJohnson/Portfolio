---
slug: complaint-agent
title: LLM Complaint Management Agent
tagline: An AI copilot for pharma quality teams that turns a raw complaint email or PDF into a structured, risk-assessed QMS record in seconds.
years: 2026
role: Solo build for an AI engineering take-home assignment: backend, LangGraph agent, frontend and Docker setup
status: Complete
repo: https://github.com/Krupa1316/AIVOAProject
stack: [Python, FastAPI, LangGraph, Groq, React, Redux Toolkit, PostgreSQL, Docker, nginx]
---

## Overview
A Customer Complaint Management module for a pharmaceutical manufacturer's Quality Management System (QMS). A QA reviewer pastes a complaint email, or attaches a PDF, DOCX or EML file, into an **AI Copilot**. A LangGraph agent then extracts every QMS field, writes a summary and runs a risk assessment, filling in the *Log Customer Complaint* form automatically.

The reviewer can keep chatting: a follow-up message either **corrects a field** ("actually the batch number is X"), which patches just that field, or **asks a question** about the complaint, answered only from the complaint's own data. Committed complaints go to a list where reviewers open each record and manage its status.

## How it works
1. **Intake.** `POST /api/complaints/analyze` accepts pasted text or an uploaded PDF, DOCX or EML file. A document parser turns the file into plain text.
2. **Three-node LangGraph agent.** A `StateGraph` runs `extract_fields` → `summarize` → `classify_risk`. Each node calls a Groq-hosted LLM in JSON mode, so the output is structured, not free text.
3. **Risk assessment.** `classify_risk` assigns severity (Critical / Major / Minor) and priority, explains why, suggests the next action and flags whether a CAPA (Corrective and Preventive Action) is needed.
4. **Chat router.** `POST /api/complaints/chat` classifies each follow-up as a *correction* or a *question*. Corrections are only accepted for known form fields, so the model can't invent new ones; questions are answered from the current record.
5. **Ledger.** Committed complaints are stored in PostgreSQL. Reviewers list them, open the detail page and update status and CAPA.
6. **Packaging.** Three containers (Postgres, FastAPI and the React app served by nginx) start with one `docker-compose up`.

## Features
- Paste text or attach PDF, DOCX or EML complaints
- Auto-filled QMS form: source, customer, product, strength, batch, dates, quantity, site, complaint type and description
- AI summary, severity, priority, rationale, next action and CAPA recommendation
- Conversational corrections that update a single field, highlighted green, without touching the rest
- Follow-up questions answered only from the complaint's own data
- Complaint list and reviewer detail page with status management
- Interactive API docs (Swagger UI)

## Results
- Full analysis of a PDF quality-defect complaint (21 structured fields, including the summary and risk assessment) in 4.4 s. Source: `curl … /api/complaints/analyze`, see the capture below
- All three sample complaints (an adverse-event email, a quality-defect PDF and a packaging/labelling email) were extracted, risk-rated, committed and listed. Source: the run in the screenshots

## Challenges and decisions
- **A graph, not one giant prompt.** Splitting extraction, summarisation and risk classification into separate LangGraph nodes keeps each prompt small and each step's output easy to check.
- **Corrections are allow-listed.** The chat router may only update fields that exist in the form schema, and booleans are normalised, so a chatty model can't corrupt the record.
- **Model churn.** The assignment named `gemma2-9b-it`, which Groq has since retired. Because the model is a single setting (`GROQ_EXTRACTION_MODEL`), switching only needed a config change. For these captures it ran on `openai/gpt-oss-120b`.

## Run it
```
cp .env.example .env        # add GROQ_API_KEY
docker-compose up --build
```
App: http://localhost:3100 · API docs: http://localhost:8000/docs

## Note on these captures
Captured on 14 Oct 2026 with Docker Desktop on Windows, using the repository's own sample complaints (fictional people and products). The model was set to `openai/gpt-oss-120b` because the original default is no longer offered by Groq.

## Screenshots
- 01-ai-extraction.png — An adverse-event email attached to the AI Copilot: the form fills itself and the complaint is rated Critical / Urgent with CAPA recommended.
- 02-field-correction.png — "Actually the batch number is MXR-2405-B": only that field changes, briefly highlighted green.
- 03-follow-up-question.png — A follow-up question about recall escalation, answered from the complaint's own data.
- 04-pdf-intake.png — A quality-defect complaint letter attached as a PDF, extracted into the same form.
- 05-complaints-list.png — The ledger after committing all three sample complaints, with severity, priority, CAPA and status.
- 06-reviewer-detail.png — The reviewer's detail page, with the complaint moved to "Under Review".
- 07-api-docs.png — The FastAPI backend's interactive API documentation.

## Terminal captures
- 01-analyze-pdf.txt — Calling the analysis API directly with the PDF complaint: every QMS field, the summary and the risk assessment as JSON.
