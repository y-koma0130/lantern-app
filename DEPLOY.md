# Lantern — Cloudflare デプロイガイド

## 前提条件

- Cloudflare アカウント
- `wrangler` CLI (`pnpm dlx wrangler login` でログイン済み)
- Supabase プロジェクト（本番用）
- Stripe アカウント + Products/Prices 作成済み

## 1. Secrets を設定

```bash
# Supabase
wrangler secret put NEXT_PUBLIC_SUPABASE_URL
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# Anthropic (Claude API)
wrangler secret put ANTHROPIC_API_KEY

# Resend (email)
wrangler secret put RESEND_API_KEY

# Stripe
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put STRIPE_PRICE_STARTER
wrangler secret put STRIPE_PRICE_PRO
wrangler secret put STRIPE_PRICE_TEAM

# App URL
wrangler secret put NEXT_PUBLIC_APP_URL
```

## 2. デプロイ

```bash
pnpm deploy
```

これは以下を実行します:
1. `opennextjs-cloudflare build` — Next.js を Cloudflare Workers 向けにビルド
2. `wrangler deploy` — Workers にデプロイ

## 3. Stripe Webhook 設定

Stripe Dashboard → Developers → Webhooks で以下を設定:
- Endpoint URL: `https://lantern.<your-domain>/api/stripe/webhook`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Signing secret → `STRIPE_WEBHOOK_SECRET` に設定済みの値

## 4. Cron Triggers

`wrangler.jsonc` で以下が設定済み:
- `0 6 * * 1` — 毎週月曜 06:00 UTC: 全組織の競合情報パイプライン実行
- `0 8 * * *` — 毎日 08:00 UTC: Pro/Team 組織向け日次アラートチェック

## アーキテクチャ

```
1つの Cloudflare Worker
├── fetch handler (OpenNext) — Next.js ページ + API Routes
└── scheduled handler (Cron) — エージェントパイプライン

Bindings:
├── ASSETS — 静的ファイル (.open-next/assets)
└── BROWSER — Browser Rendering (Playwright スクレイピング)
```

## ローカル開発

```bash
supabase start        # ローカル Supabase
pnpm dev              # Next.js dev server (localhost:3000)
```

注意: Cron Trigger はローカルでは動きません。パイプラインをローカルでテストするには:
```bash
npx tsx agents/pipeline.ts
```
