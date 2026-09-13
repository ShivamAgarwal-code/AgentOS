# 🤖 AgentOS

**One AI agent that takes action across all your apps.**

Describe a goal in plain English — AgentOS plans a multi-step workflow with Claude Opus 4.8 and executes it across your connected apps (Slack, Gmail, Notion, GitHub, Calendar, Linear and 17 more), streaming a live action trace.

Built for the hackathon theme: *an AI agent that takes action across multiple external apps.*

## Run it

The application lives in [`chronicle-ai-main/`](./chronicle-ai-main):

```bash
cd chronicle-ai-main
npm install
cp .env.example .env    # set ANTHROPIC_API_KEY (optional — heuristic fallback works without it)
npm run dev             # http://localhost:3000
```

See [`chronicle-ai-main/README.md`](./chronicle-ai-main/README.md) for full documentation — features, architecture, tech stack, and API.
