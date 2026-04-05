# CyberCI — Service Design Document

## Overview

CyberCI is a fully automated competitive intelligence SaaS targeting **Product Marketing Managers (PMMs) and product teams at Cybersecurity SaaS companies**.

The service automatically monitors competitor activity across public sources every week, synthesizes the signals using AI agents, and delivers actionable battlecard-style digests via Email, Slack, or Discord — whichever channel the subscriber prefers.

**Core value proposition:** Reduce the time spent tracking competitors from 3+ hours per week to under 15 minutes, at a fraction of the cost of enterprise CI platforms like Crayon ($12k+/year) or Klue ($16k+/year).

---

## Problem

Cybersecurity SaaS is one of the fastest-moving markets in B2B software. Pricing changes, feature launches, funding rounds, and hiring signals happen weekly. PMMs at growth-stage companies need to stay current but lack:

- Time to manually monitor 10–25 competitors
- Budget for enterprise CI tools
- A way to share competitive context with sales and GTM teams quickly

---

## Solution

A multi-agent pipeline that runs on a weekly cron schedule, collects raw signals from public sources, analyzes and scores them, generates structured battlecards, and delivers them to each subscriber's preferred channel.

---

## Target Market

**Primary persona:** Product Marketing Manager or Head of Product at a Cybersecurity SaaS company

- Company size: 10–300 employees (growth stage)
- Geography: North America, Western Europe
- Stage: Series A–C (too small for Crayon/Klue, serious enough to care)

**Sub-niches to target first (in priority order):**

1. Cloud Security SaaS (most active, most players)
2. GRC / Compliance SaaS (regulation-driven, high WTP)
3. Identity & Access Management (IAM) SaaS

---

## Pricing

| Plan    | Price      | Competitors tracked | Frequency     | Channels          |
|---------|------------|---------------------|---------------|-------------------|
| Free    | $0         | 3                   | Monthly only  | Email only        |
| Starter | $99/month  | 10                  | Weekly        | Email + Slack     |
| Pro     | $249/month | 25                  | Weekly + daily alerts | All channels |
| Team    | $499/month | Unlimited           | Custom        | All + CSV/API     |

**MRR target:** $10,000 MRR = 41 Pro subscribers

---

## Agent Architecture

The system is composed of five agents running in a sequential pipeline, triggered by a weekly cron scheduler.

```
Scheduler (cron)
      │
      ▼  weekly trigger
Collector Agent
      │
      ▼  raw signals
Analyst Agent
      │
      ▼  scored insights
Battlecard Generator
      │
      ▼  formatted output
Delivery Agent
      │
   ┌──┼──┐
   ▼  ▼  ▼
Email Slack Discord
```

---

### Agent 1: Collector Agent

**Role:** Crawl and collect raw data from public sources on a weekly schedule.

**Data sources:**

| Source       | Data collected                                      | Method             |
|--------------|-----------------------------------------------------|--------------------|
| Company sites | Pricing page diffs, feature page changes, blog posts | HTML crawl + diff  |
| G2 / Capterra | New reviews, rating changes, category rank shifts  | API / scrape       |
| GitHub       | Repository activity, new repos, star count changes  | GitHub API         |
| LinkedIn Jobs | New job postings by role (signals investment areas) | Scrape             |
| HackerNews   | Competitor mentions in threads                      | HN API             |
| Crunchbase   | Funding rounds, acquisitions, leadership changes    | Scrape / API       |

**Output:** Raw signal records stored in `competitor_snapshots` table in Supabase.

---

### Agent 2: Analyst Agent

**Role:** Process raw signals, detect meaningful changes, score by importance, and filter noise.

**Scoring priority (high → low):**

1. Pricing page change (strong competitive signal)
2. New feature launch or product page addition
3. Significant hiring surge in a specific function
4. Funding or M&A event
5. G2 rating/review trend shift
6. Messaging or positioning change

**Key logic:** Only signals that exceed a configurable threshold pass to the next stage. This noise-filtering step is the primary differentiator from simple page-monitoring tools like VisualPing.

**Output:** Scored and categorized insight records stored in `insights` table.

---

### Agent 3: Battlecard Generator

**Role:** Transform scored insights into structured, human-readable competitive intelligence using the Claude API.

**Output format per competitor:**

```
## [Competitor Name] — Week of [date]

### What changed
- [Change 1 with context]
- [Change 2 with context]

### Pricing update
[Summary of any pricing delta detected]

### G2 sentiment trend
[Direction + key themes from new reviews]

### Hiring signals
[What roles they're hiring for = where they're investing]

### Key takeaway
[1–2 sentence strategic implication for the subscriber]
```

**Weekly digest format:** Aggregates all monitored competitors into a single digest, with a "top 3 changes this week" summary at the top.

**Output:** Formatted Markdown and HTML stored in `digests` table, linked to subscriber.

---

### Agent 4: Delivery Agent

**Role:** Route the formatted digest to each subscriber's configured channel(s).

**Routing logic:**
- Read subscriber preferences from `subscribers` table
- Send via configured channel(s): Email (Resend), Slack Webhook, Discord Webhook
- Log delivery status to `delivery_logs` table
- Retry failed deliveries up to 3 times

---

## Technology Stack

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| Framework     | Next.js 15 (App Router)                         |
| Language      | TypeScript                                      |
| Database      | Supabase (Postgres)                             |
| Agent runtime | TypeScript + Anthropic SDK + node-cron          |
| Email         | Resend                                          |
| Notifications | Slack Webhook API, Discord Webhook API          |
| Auth          | Supabase Auth                                   |
| Payments      | Stripe                                          |
| Hosting       | EC2 t3.small (agent runtime), Vercel (Next.js)  |
| CI/CD         | GitHub Actions                                  |

---

## Database Schema (Supabase)

### `subscribers`
```sql
id            uuid PRIMARY KEY
email         text UNIQUE NOT NULL
plan          text NOT NULL DEFAULT 'free'
channel_email boolean DEFAULT true
channel_slack text      -- webhook URL or null
channel_discord text    -- webhook URL or null
competitor_ids uuid[]   -- list of tracked competitor IDs
digest_frequency text DEFAULT 'weekly'
created_at    timestamptz DEFAULT now()
```

### `competitors`
```sql
id            uuid PRIMARY KEY
name          text NOT NULL
website       text NOT NULL
g2_url        text
github_org    text
linkedin_slug text
crunchbase_slug text
niche         text  -- 'cloud_security' | 'grc' | 'iam'
created_at    timestamptz DEFAULT now()
```

### `competitor_snapshots`
```sql
id              uuid PRIMARY KEY
competitor_id   uuid REFERENCES competitors(id)
source          text  -- 'website' | 'g2' | 'github' | 'linkedin' | 'hn' | 'crunchbase'
raw_data        jsonb
collected_at    timestamptz DEFAULT now()
```

### `insights`
```sql
id              uuid PRIMARY KEY
competitor_id   uuid REFERENCES competitors(id)
snapshot_id     uuid REFERENCES competitor_snapshots(id)
type            text  -- 'pricing' | 'feature' | 'hiring' | 'funding' | 'sentiment' | 'messaging'
importance_score int  -- 1-10
summary         text
diff_detail     jsonb
week_of         date
created_at      timestamptz DEFAULT now()
```

### `digests`
```sql
id              uuid PRIMARY KEY
subscriber_id   uuid REFERENCES subscribers(id)
week_of         date
content_md      text
content_html    text
generated_at    timestamptz DEFAULT now()
```

### `delivery_logs`
```sql
id              uuid PRIMARY KEY
digest_id       uuid REFERENCES digests(id)
channel         text  -- 'email' | 'slack' | 'discord'
status          text  -- 'sent' | 'failed' | 'retrying'
attempted_at    timestamptz DEFAULT now()
```

---

## Automation Schedule

```
Every Monday 06:00 UTC
  └─ Collector Agent runs for all tracked competitors
       └─ Analyst Agent scores new snapshots
            └─ Battlecard Generator produces digests
                 └─ Delivery Agent routes to each subscriber
```

Alert-level checks (Pro/Team plans): daily at 08:00 UTC, only fires if importance_score >= 8.

---

## Repository Structure

```
cyberci/
├── apps/
│   └── web/                  # Next.js frontend (dashboard, onboarding, settings)
│       ├── app/
│       │   ├── dashboard/
│       │   ├── settings/
│       │   └── api/
│       └── components/
├── packages/
│   └── agents/               # Agent runtime (TypeScript)
│       ├── collector/
│       │   ├── index.ts
│       │   ├── sources/
│       │   │   ├── website.ts
│       │   │   ├── g2.ts
│       │   │   ├── github.ts
│       │   │   ├── linkedin.ts
│       │   │   ├── hackernews.ts
│       │   │   └── crunchbase.ts
│       │   └── scheduler.ts
│       ├── analyst/
│       │   ├── index.ts
│       │   ├── scorer.ts
│       │   └── differ.ts
│       ├── battlecard/
│       │   ├── index.ts
│       │   ├── prompt.ts
│       │   └── formatter.ts
│       ├── delivery/
│       │   ├── index.ts
│       │   ├── email.ts
│       │   ├── slack.ts
│       │   └── discord.ts
│       └── shared/
│           ├── db.ts          # Supabase client
│           └── types.ts
├── supabase/
│   └── migrations/
├── .env.example
└── README.md
```

---

## MVP Scope (Phase 1)

Build the minimum viable version to validate demand before adding complexity.

**In scope:**
- Fixed list of 20 Cloud Security SaaS competitors (hardcoded, no custom input yet)
- Collector: website diff + G2 reviews only (skip GitHub/LinkedIn/Crunchbase initially)
- Weekly digest via Email only (Slack/Discord in Phase 2)
- Simple Next.js settings page + Stripe checkout
- Manual onboarding for first 10 beta users (free)

**Out of scope for MVP:**
- Custom competitor lists per subscriber
- Daily alerts
- Slack / Discord delivery
- API / CSV export
- Dashboard with historical trends

---

## Launch Plan

| Phase | Timeline | Goal |
|-------|----------|------|
| Phase 1 — MVP | Month 1–2 | Working pipeline for 20 competitors, email delivery, 10 free beta users |
| Phase 2 — Monetization | Month 3–4 | Stripe integration, Slack/Discord delivery, Product Hunt launch |
| Phase 3 — Expansion | Month 5–6 | Custom competitor lists, GRC/IAM niche support, daily alerts for Pro |

---

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Resend (email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Optional: G2 API
G2_API_KEY=

# Optional: Crunchbase
CRUNCHBASE_API_KEY=
```

---

## Key Design Decisions

**Analyst Agent is the moat.** Simple diff tools (VisualPing, etc.) detect that a page changed. The Analyst Agent interprets *what* changed and *why it matters*. This interpretation layer — scoring "pricing page H2 text changed from $99 to $129" as a high-importance pricing event — is where the value is created and where competitors cannot easily copy.

**Email-first, channels-second.** Start with email delivery only for MVP. Add Slack and Discord webhooks once the core pipeline is validated. The delivery layer is intentionally thin and pluggable.

**Supabase as the single source of truth.** All agent state (snapshots, insights, digests, delivery logs) lives in Supabase. Agents are stateless TypeScript processes that read/write to the DB. This makes the system easy to debug and restart without data loss.

**Monorepo from day one.** Web app and agent runtime share types and the Supabase client. Avoids drift between the frontend schema assumptions and the agent's actual data shape.
