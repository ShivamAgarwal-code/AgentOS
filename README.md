<div align="center">

# 🤖 AgentOS

### One AI agent that takes action across all your apps

**Describe a goal in plain English. AgentOS plans a multi-step workflow with Claude Opus 4.8 and executes it across your connected apps - Slack, Gmail, Notion, GitHub, Calendar, Linear and 17 more - streaming a live action trace.**

[![Claude](https://img.shields.io/badge/Brain-Claude%20Opus%204.8-D97757)](https://www.anthropic.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Build-Vite%206-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/UI-Tailwind%20v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Server-Express-000000?logo=express&logoColor=white)](https://expressjs.com)

</div>

---

## 🎯 The theme

> **"An AI agent that takes action across multiple external apps."**

AgentOS is exactly that. You give it a goal - *"a customer emailed asking for a refund, process it and keep everyone in the loop"* - and it:

1. **Plans** a cross-app workflow with **Claude Opus 4.8**, constrained to the apps you've connected and the concrete actions each one exposes.
2. **Executes** each step across those apps, streaming a live, animated action trace.
3. **Records** every action in a cross-app activity log.

No dashboards to wire together, no scripts to write - just say what you want done, and one agent does it everywhere.

---

## 📑 Table of Contents

- [Why AgentOS](#-why-agentos)
- [Features](#-features)
- [How it works](#-how-it-works)
- [The 23 connected apps](#-the-23-connected-apps)
- [Tech stack](#-tech-stack)
- [Getting started](#-getting-started)
- [Environment variables](#-environment-variables)
- [Project structure](#-project-structure)
- [API reference](#-api-reference)
- [Design system](#-design-system)
- [Resilience & fallbacks](#-resilience--fallbacks)
- [Roadmap](#-roadmap)

---

## 💡 Why AgentOS

Modern work is spread across a dozen tools. A single "handle this" task usually means: reply in Gmail, log it in Notion, open a Linear ticket, and ping the team in Slack - four apps, four context switches.

AgentOS collapses that into one instruction. It's not a chatbot that *tells you* what to do; it's an **agent that does it**, across every app you've connected, and shows you exactly what it did.

---

## ✨ Features

### ⚡ Agent Console - the hero
A single natural-language box turns any goal into an ordered, **multi-app** action plan that runs step-by-step with a live execution trace. Each step shows the app, the action, its parameters, the result, and whether it ran **live** or **simulated**. Includes example prompts and a `Ctrl/Cmd + Enter` shortcut to run.

### 🔌 Integrations Hub
**23 external apps** across **9 categories**, each with a connect/disconnect toggle, category filters, and search. The more apps you connect, the more the agent can accomplish in a single run. Connection state is persisted server-side and drives what the planner is allowed to do.

### 📊 Activity Log
A timeline of every action the agent has taken across your apps - per-app result, live/simulated status, deep link, and the original goal that triggered it.

---

## 🧠 How it works

```
                Goal (plain English)
                        |
                        v
        +-------------------------------+     builds a toolset from
        |        Claude Opus 4.8        |<---- your CONNECTED apps and the
        |   (planner, structured JSON)  |      actions each one exposes
        +---------------+---------------+
                        |  ordered, cross-app plan
                        v
        +-------------------------------+     Slack -> real HTTP call (chat.postMessage)
        |           Executor            |---->  when a bot token is present
        |  (connector dispatch layer)   |      every other app -> realistic simulated result
        +---------------+---------------+
                        |
                        v
          Live action trace  +  Activity log
```

1. **Toolset from connectors.** `src/connectors/catalog.ts` is a dependency-free registry declaring every app and the concrete actions the agent may take in it (e.g. Slack -> `send_message`, Linear -> `create_issue`). It's shared by both the server (planning + execution) and the client (Integrations UI).
2. **Planning.** The agent sends the goal plus the catalog of *connected* apps to Claude, which returns an ordered, cross-app plan as strict JSON.
3. **Execution.** Each step is dispatched to its connector. Slack runs a **real** API call when credentials exist; every other app returns a realistic simulated result so the end-to-end flow always completes.
4. **Recording.** Every executed step is fanned into the activity log and the run history.

---

## 🗂 The 23 connected apps

| Category | Apps |
|----------|------|
| **Communication** | Slack, Discord, Microsoft Teams, Gmail, Outlook |
| **Productivity** | Notion, Google Docs, Confluence, Airtable |
| **Development** | GitHub, GitLab |
| **Project Management** | Linear, Jira, Trello, Asana |
| **CRM & Sales** | HubSpot, Salesforce |
| **Calendar & Scheduling** | Google Calendar, Calendly |
| **Storage** | Google Drive, Dropbox |
| **Finance** | Stripe |
| **Support** | Zendesk |

> Slack and GitHub are **live-capable** (real API calls when tokens are configured); the rest execute in realistic simulation for the demo.

---

## 🛠 Tech stack

| Layer | Choice |
|-------|--------|
| **AI** | Anthropic **Claude Opus 4.8** via the official `@anthropic-ai/sdk` |
| **Frontend** | React 19 + TypeScript, Vite 6, Tailwind CSS v4, Framer Motion |
| **Server** | Node.js + Express (served through Vite middleware in dev) |
| **Integrations** | Slack Bolt (live) plus a 23-app connector registry |

---

## 🚀 Getting started

```bash
npm install

# Optional - enables the real Claude planner (otherwise the heuristic fallback runs)
cp .env.example .env      # then set ANTHROPIC_API_KEY

npm run dev               # http://localhost:3000
```

That's it - one command runs the Express API, the Vite dev server, and the Slack agent in a single process.

**Build for production:**

```bash
npm run build   # vite build + esbuild bundle
npm run start   # node dist/server.cjs
```

---

## 🔑 Environment variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Enables the Claude-powered planner (falls back to a heuristic planner if unset) |
| `ANTHROPIC_MODEL` | Optional model override (default `claude-opus-4-8`) |
| `SLACK_BOT_TOKEN` / `SLACK_SIGNING_SECRET` | Optional - enables **live** Slack message execution |
| `PORT` | Server port (default `3000`) |

---

## 📁 Project structure

```
AgentOS/
├── server.ts                      # Express API + Vite middleware
├── src/
│   ├── App.tsx                    # app shell + routing
│   ├── connectors/catalog.ts      # 23 apps + their actions (the agent's toolset)
│   ├── services/
│   │   ├── agentService.ts        # Claude planner + cross-app executor (+ heuristic fallback)
│   │   └── aiReasoningService.ts  # Claude-powered decision-replay engine
│   ├── components/
│   │   ├── AgentConsoleView.tsx   # hero: goal -> live cross-app trace
│   │   ├── IntegrationsView.tsx   # integrations hub
│   │   ├── ActivityView.tsx       # activity log
│   │   ├── Sidebar.tsx / AppIcon.tsx / AgentOSLogo.tsx
│   │   └── ... (Dashboard, Memory Graph, Decision Replay, Analytics, Settings)
│   └── index.css                  # Claude/Anthropic design system + animations
├── index.html
├── package.json
└── vite.config.ts
```

---

## 🔌 API reference

| Endpoint | Description |
|----------|-------------|
| `POST /api/agent/run` | `{ goal }` -> plans **and** executes a cross-app workflow, returns the run with per-step results |
| `GET /api/integrations` | List all 23 connectors plus connection status |
| `POST /api/integrations/:id` | Connect / disconnect an app (`{ connected: boolean }`) |
| `GET /api/activity` | Cross-app action history |
| `GET /api/agent/runs` | Recent agent runs |
| `GET /api/health` | Health check |

**Example:**

```bash
curl -X POST http://localhost:3000/api/agent/run \
  -H "Content-Type: application/json" \
  -d '{"goal":"A customer emailed asking for a refund, process it and notify the team"}'
```

---

## 🎨 Design system

AgentOS uses a warm, **Claude/Anthropic-inspired aesthetic**: creamy ivory backgrounds (`#FAF9F5`), coal text, and a clay/coral accent (`#D97757`) - deliberately **no green** (live/success states use a warm amber). Tasteful motion throughout: fade, slide-up, float, shimmer skeletons, and an animated clay gradient on the wordmark. Light and dark themes are both first-class.

---

## 🛡 Resilience & fallbacks

- **No API key? Still works.** If `ANTHROPIC_API_KEY` is missing, a deterministic **heuristic planner** produces a sensible multi-app plan, so the demo never dead-ends.
- **Live where possible, simulated everywhere else.** Slack posts for real when a bot token is set; every other app returns a realistic, plausible result with generated IDs and deep links.
- **Structured output.** The planner uses a JSON contract, so plans are always valid and parseable.

---

## 🗺 Roadmap

- Real OAuth connect flows for each app (live execution beyond Slack/GitHub)
- Human-in-the-loop approval gates before irreversible actions
- Scheduled and event-triggered agent runs
- Per-step retry and rollback

---

<div align="center">
<sub>Built for the hackathon theme: <em>an AI agent that takes action across multiple external apps.</em></sub>
</div>
