# Lantern

Automated competitive intelligence for cybersecurity SaaS companies.

Lantern monitors your competitors' websites, G2 reviews, and public signals, then delivers AI-generated intelligence digests to your team via email, Slack, or Discord. Built for security vendors who need to stay ahead of market shifts without spending hours on manual research.

## Features

- **Automated competitor monitoring** -- Scrapes competitor websites and review platforms on a weekly schedule
- **AI-powered analysis** -- Claude-based analyst agent extracts insights and scores them by importance
- **Battle cards** -- Auto-generated competitive battle cards for sales teams (Pro and Team plans)
- **Multi-channel delivery** -- Email digests for all plans; Slack and Discord webhooks for Starter+
- **Daily alerts** -- Real-time competitive alerts for Pro and Team plans
- **Team collaboration** -- Multi-user organizations with role-based access (owner/member)
- **Invite system** -- Email-based team invitations with secure accept flow
- **Plan-based feature gating** -- Stripe-powered billing with four tiers

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | Supabase (Postgres + Auth + Row Level Security) |
| Hosting | Cloudflare Workers via OpenNext |
| Scraping | Cloudflare Browser Rendering + Playwright |
| AI | Anthropic Claude SDK |
| Email | Resend |
| Payments | Stripe |
| UI | Tailwind CSS v4 (Atlassian Design System) |
| State | Jotai |
| Validation | Zod |
| Linter | Biome |

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker (for local Supabase)
- Supabase CLI (`brew install supabase/tap/supabase`)

### Clone and install

```bash
git clone https://github.com/your-org/lantern-app.git
cd lantern-app
pnpm install
```

### Environment variables

Create `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key>

# Anthropic (Claude API)
ANTHROPIC_API_KEY=sk-ant-...

# Resend (email)
RESEND_API_KEY=re_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...
STRIPE_PRICE_TEAM_YEARLY=price_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Local Supabase setup

```bash
supabase start
```

This starts a local Supabase instance with Postgres, Auth, and applies all migrations from `supabase/`.

### Run dev server

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Other commands

```bash
pnpm build            # Next.js production build
pnpm lint:fix         # Biome lint + auto-fix
pnpm typecheck        # TypeScript type checking
pnpm deploy           # Build and deploy to Cloudflare Workers
```

## Project Structure

```
lantern-app/
├── app/                  # Next.js App Router (thin page wrappers)
│   ├── (auth)/           # Login and signup pages
│   ├── (app)/            # Authenticated app shell ([orgSlug] scoped)
│   ├── api/              # Route Handlers (REST API)
│   ├── invite/           # Public invitation accept page
│   ├── onboarding/       # Organization creation flow
│   └── auth/callback/    # Supabase auth callback
├── src/
│   ├── components/       # Shared UI components
│   ├── features/         # Feature modules (auth, dashboard, billing, settings, etc.)
│   ├── hooks/            # Shared React hooks
│   ├── stores/           # Global state (Jotai atoms)
│   └── lib/              # Utilities (supabase/, stripe, plan-limits, email, api helpers)
├── agents/               # Agent pipeline modules
│   ├── collector/        # Website and review scraping
│   ├── analyst/          # AI-powered insight extraction
│   ├── battle-card/      # Competitive battle card generation
│   ├── delivery/         # Email, Slack, and Discord delivery
│   └── shared/           # Shared agent utilities (browser, org repository)
├── workers/              # Cloudflare Worker entry points (cron, workflow)
├── supabase/             # Database migrations
├── wrangler.jsonc        # Cloudflare Workers configuration
├── custom-worker.ts      # Worker entry point (OpenNext + cron handler)
└── open-next.config.ts   # OpenNext adapter configuration
```

## Plans and Pricing

| Feature | Free | Starter | Pro | Team |
|---------|------|---------|-----|------|
| Monthly price | $0 | $79 | $199 | $399 |
| Yearly price | -- | $790/yr | $1,990/yr | $3,990/yr |
| Competitors | 3 | 10 | 20 | 50 |
| Users | 1 | 3 | 10 | 25 |
| Digest frequency | Monthly | Weekly | Weekly + daily alerts | Weekly + daily alerts |
| Email delivery | Yes | Yes | Yes | Yes |
| Slack / Discord | No | Yes | Yes | Yes |
| Battle cards | No | No | Yes | Yes |
| CSV export | No | No | Yes | Yes |
| Archive retention | 7 days | 30 days | 90 days | Unlimited |
| Support | Community | Email | Priority email | Priority email |

## Deployment

Lantern runs on Cloudflare Workers using OpenNext as the Next.js adapter.

```bash
pnpm deploy
```

This runs `opennextjs-cloudflare build` followed by `wrangler deploy`.

Before deploying, configure all required secrets via `wrangler secret put`. See [DEPLOY.md](./DEPLOY.md) for the full deployment guide, including:

- Cloudflare secrets configuration
- Stripe webhook endpoint setup
- Cron trigger schedule (weekly pipeline + daily alerts)

### Cron Triggers

Configured in `wrangler.jsonc`:

| Schedule | Description |
|----------|-------------|
| `0 6 * * 1` | Weekly pipeline run (Monday 06:00 UTC) -- all organizations |
| `0 8 * * *` | Daily alert check (08:00 UTC) -- Pro and Team organizations only |

## Architecture

Lantern uses an agent pipeline architecture running on Cloudflare Workers:

```
Cron Trigger
  └── Pipeline (per organization)
        ├── 1. Collector    — Scrapes competitor websites and G2 reviews using Playwright
        ├── 2. Analyst      — Claude AI extracts and scores competitive insights
        ├── 3. Battle Card  — Claude AI generates sales battle cards (Pro/Team only)
        └── 4. Delivery     — Sends digest via Email, Slack, and/or Discord
```

The pipeline runs for each active organization. Feature gating is applied at each stage -- for example, battle card generation is skipped for Free and Starter plans, and Slack/Discord delivery is skipped for Free plans.

The web application is a standard Next.js 15 App Router app served through the same Cloudflare Worker via OpenNext. Supabase provides the database (Postgres), authentication, and row-level security for multi-tenant data isolation.

## License

Proprietary. All rights reserved.
