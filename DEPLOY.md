# Deploying AgentOS

AgentOS is a single full-stack Node app: the Express server serves both the
built React frontend and the API from one process, and it keeps some state in
memory (which apps are connected, the activity log, the live Slack receiver).
That makes a **persistent web service the right target**, which is why
**Render is the recommended host**. Vercel is possible but has caveats (see
below) because its serverless model does not keep a process (or in-memory
state) alive between requests.

TL;DR: use **Render** for the whole app. Reach for Vercel only if you
specifically want the frontend on Vercel and the API on Render (a split
deployment).

---

## Option A - Render (recommended, deploys the whole app)

### Fastest: Blueprint (uses `render.yaml`)

1. Push this repo to GitHub (already done).
2. Go to <https://dashboard.render.com> and sign in.
3. **New +  ->  Blueprint**.
4. Connect the `AgentOS` repo. Render reads `render.yaml` and proposes an
   `agentos` web service.
5. Click **Apply**. When prompted, fill in the secret env vars:
   - `ANTHROPIC_API_KEY` - your Anthropic key (optional; without it the
     heuristic planner runs).
   - `SLACK_BOT_TOKEN` / `SLACK_SIGNING_SECRET` - optional, only for live Slack.
6. Wait for the build (`npm install && npm run build`) and first deploy. Your
   app will be live at `https://agentos-XXXX.onrender.com`.

### Manual (no blueprint)

1. **New +  ->  Web Service**  ->  connect the repo.
2. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `NODE_ENV=production node dist/server.cjs`
   - **Health Check Path:** `/api/health`
3. Add the environment variables from the table below.
4. **Create Web Service.**

> Render injects `PORT` automatically and the server binds to it on `0.0.0.0`.
> The free plan spins the service down when idle, so the first request after a
> pause takes ~30s to wake - fine for a demo.

---

## Option B - Vercel

Vercel is built for static sites and short-lived serverless functions. This app
is a long-running Express server with in-memory state and a Slack Bolt
receiver, so a straight Vercel deploy has real limitations:

- In-memory state (connected apps, activity log) is **not shared** across
  serverless invocations and resets on cold starts.
- The live Slack receiver needs a persistent process, which serverless does not
  provide.

If you still want Vercel, the clean pattern is a **split deploy**:

1. Deploy the **API** to Render (Option A) - that URL is your backend.
2. Deploy only the **frontend** to Vercel as a static build:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Point the frontend at the Render API. The client currently calls the API
   same-origin (`fetch("/api/...")`), so a split needs either a Vercel rewrite
   proxying `/api/*` to the Render service, or a small change to read an API
   base URL from an env var. Add this to a `vercel.json` to proxy:

   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://YOUR-RENDER-URL.onrender.com/api/:path*" }
     ]
   }
   ```

For the AgentOS demo, **Option A (Render, single service) is simpler and keeps
every feature working** - prefer it unless you have a specific reason to split.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Recommended | Enables the Claude-powered planner (falls back to heuristic if unset) |
| `ANTHROPIC_MODEL` | No | Model override (default `claude-opus-4-8`) |
| `SLACK_BOT_TOKEN` | No | Enables live Slack message execution |
| `SLACK_SIGNING_SECRET` | No | Required alongside the bot token for Slack |
| `PORT` | No | Provided automatically by Render |
| `NODE_ENV` | Yes (prod) | Set to `production` so the server serves the built `dist/` |

---

## Verify a deploy

```bash
curl https://YOUR-APP.onrender.com/api/health
# {"status":"healthy",...}

curl https://YOUR-APP.onrender.com/api/integrations | head
# list of 23 connectors
```

Then open the URL in a browser - the Agent Console loads on the home page.
