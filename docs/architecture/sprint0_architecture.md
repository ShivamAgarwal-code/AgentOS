# Chronicle AI — Sprint 0 Technical Architecture

## Core Mission
Organizations lose reasoning. People remember decisions, but nobody remembers **why** they were made. Chronicle AI continuously watches Slack conversations and automatically synthesizes an organizational memory, keeping track of decisions, architecture decision records (ADR), technical experts, and building an organization's knowledge graph.

## System Architecture Blueprint

```
                     ┌────────────────────────┐
                     │       Slack App        │
                     │  (Slack Bolt Python)   │
                     └───────────┬────────────┘
                                 │ Event Subscriptions / Slash Commands
                                 ▼
                     ┌────────────────────────┐
                     │  Python FastAPI Core   │
                     │   (SQLite SQLAlchemy)  │
                     └───────────┬────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
     ┌───────────────────────┐       ┌───────────────────────┐
     │      Chronicle AI     │       │   Enterprise React    │
     │    Reasoning Engine   │       │   Dashboard Shell     │
     │   (Gemini Flash SDK)  │       │ (Next.js/Tailwind/Flow)│
     └───────────────────────┘       └───────────────────────┘
```

## Layered Design & Separation of Concerns

1. **Slack Integration Layer (`/slack`)**
   - Built on `slack-bolt-python` SDK.
   - Monitors messages, mentions, and commands in designated channels.
   - Forwards conversational feeds into the reasoning engine pipeline.

2. **Backend API Layer (`/backend`)**
   - Built with Python `FastAPI` for rapid, type-safe API schemas.
   - Handles data operations, metrics calculation, and user analytics.
   - Separates HTTP routes (`routes/`) from business services (`services/`).

3. **Data & Persistence Layer (`/backend/database`)**
   - SQLAlchemy ORM with a lightweight, high-performance SQLite database.
   - Rich indexes on foreign keys and compound search fields to support high-speed graphs.

4. **Frontend Interface Layer (`/frontend` and live `/src`)**
   - Designed around extreme visual minimalism, whitespace, and clean type pairing (Inter + JetBrains Mono).
   - Enterprise dashboard for visual inspection of the knowledge graph, decision replay timelines, expert identification, and detailed ADR documentation.
