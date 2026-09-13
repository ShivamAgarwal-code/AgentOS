<div align="center">

# 🤖 AgentOS

### One AI agent that takes action across all your apps

**Describe a goal in plain English. AgentOS plans a multi-step workflow and executes it across your connected apps — Slack, Gmail, Notion, GitHub, Calendar, Linear and 17 more.**

[![Claude](https://img.shields.io/badge/Brain-Claude%20Opus%204.8-D97757)](https://www.anthropic.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/UI-Tailwind%20v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Server-Express-000000?logo=express&logoColor=white)](https://expressjs.com)

</div>

---

## The theme

> **"An AI agent that takes action across multiple external apps."**

AgentOS is exactly that. You give it a goal — *"a customer emailed asking for a refund, process it and keep everyone in the loop"* — and it:

1. **Plans** a cross-app workflow with Claude Opus 4.8, constrained to the apps you've connected and the concrete actions each one exposes.
2. **Executes** each step across those apps, streaming a live action trace.
3. **Records** every action in a cross-app activity log.

## Features

### ⚡ Agent Console
The hero surface. A single natural-language box turns any goal into an ordered, **multi-app** action plan that runs step-by-step with a live execution trace — each step showing the app, the action, its parameters, the result, and whether it ran live or simulated.

### 🔌 Integrations Hub
**23 external apps** across 9 categories (Communication, Productivity, Development, Project Management, CRM & Sales, Calendar, Storage, Finance, Support) — Slack, Discord, Teams, Gmail, Outlook, Notion, Google Docs, Confluence, Airtable, GitHub, GitLab, Linear, Jira, Trello, Asana, HubSpot, Salesforce, Google Calendar, Calendly, Google Drive, Dropbox, Stripe, Zendesk. Search, filter by category, and connect/disconnect — the more you connect, the more the agent can do in one run.

### 📊 Activity Log
A timeline of every action the agent has taken across your apps, with per-app results and the goal that triggered them.

## How it works

```
Goal (plain English)
        │
        ▼
┌───────────────────────┐     builds toolset from
│   Claude Opus 4.8     │◀──── your CONNECTED apps' actions
│   (structured plan)   │      (the agent's tools)
└───────────┬───────────┘
            │  ordered, cross-app plan
            ▼
┌───────────────────────┐     Slack → real HTTP call when a token exists
│      Executor         │────▶ every other app → realistic simulated result
└───────────┬───────────┘
            │
            ▼
  Live action trace  +  Activity log
```

- **The brain** is Anthropic's Claude (`claude-opus-4-8`) via the official `@anthropic-ai/sdk`, using a JSON contract so plans are always valid.
- **The toolset** is a dependency-free connector registry (`src/connectors/catalog.ts`) that declares each app's allowed actions — shared by both the server (planning + execution) and the client (Integrations UI).
- **Resilience:** if no API key is present, a deterministic heuristic planner still produces a sensible multi-app plan, so the demo never dead-ends.

## Tech stack

| Layer | Choice |
|-------|--------|
| AI | Anthropic Claude Opus 4.8 (`@anthropic-ai/sdk`) |
| Frontend | React 19 + TypeScript, Vite 6, Tailwind CSS v4, Framer Motion |
| Server | Node.js + Express (served via Vite middleware in dev) |
| Integrations | Slack Bolt (live), connector registry (23 apps) |

## Getting started

```bash
cd chronicle-ai-main
npm install

# Optional — enables the real Claude planner (otherwise the heuristic fallback runs)
cp .env.example .env      # then set ANTHROPIC_API_KEY

npm run dev               # http://localhost:3000
```

### Environment variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Enables the Claude-powered planner (falls back to heuristic if unset) |
| `ANTHROPIC_MODEL` | Optional model override (default `claude-opus-4-8`) |
| `SLACK_BOT_TOKEN` / `SLACK_SIGNING_SECRET` | Optional — enables **live** Slack message execution |
| `PORT` | Server port (default `3000`) |

## Project structure

```
chronicle-ai-main/
├── server.ts                     # Express API: /api/agent/run, /api/integrations, /api/activity
├── src/
│   ├── App.tsx                   # App shell + routing
│   ├── connectors/catalog.ts     # 23 external apps + their actions (the agent's toolset)
│   ├── services/
│   │   ├── agentService.ts       # Claude planner + cross-app executor (+ heuristic fallback)
│   │   └── aiReasoningService.ts # Claude-powered decision-replay engine
│   └── components/
│       ├── AgentConsoleView.tsx  # ⚡ hero: goal → live cross-app trace
│       ├── IntegrationsView.tsx  # 🔌 integrations hub
│       └── ActivityView.tsx      # 📊 activity log
```

## API

| Endpoint | Description |
|----------|-------------|
| `POST /api/agent/run` | `{ goal }` → plans and executes a cross-app workflow |
| `GET /api/integrations` | List all connectors + connection status |
| `POST /api/integrations/:id` | Connect / disconnect an app |
| `GET /api/activity` | Cross-app action history |
| `GET /api/agent/runs` | Recent agent runs |

---

<div align="center">
<sub>Built for the hackathon theme: <em>an AI agent that takes action across multiple external apps.</em></sub>
</div>
