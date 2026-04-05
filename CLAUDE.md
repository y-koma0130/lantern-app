# Lantern

サイバーセキュリティ SaaS 企業向けの自動競合インテリジェンス SaaS。

## 技術スタック

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (Postgres + Auth + RLS)
- **Hosting:** Cloudflare Workers (OpenNext) + Browser Rendering + Cron Triggers
- **Agent Runtime:** TypeScript + Anthropic SDK + @cloudflare/playwright
- **Email:** Resend
- **Notifications:** Slack Webhook, Discord Webhook
- **Payments:** Stripe
- **UI:** Tailwind CSS v4, Atlassian Design System 準拠
- **State:** Jotai
- **Validation:** Zod
- **Linter/Formatter:** Biome
- **React:** React Compiler 使用

## プロジェクト構成

```
lantern-app/
├── src/              # Next.js app (features, components, lib)
├── app/              # Next.js App Router pages
├── agents/           # Agent pipeline (collector, analyst, battle-card, delivery)
├── workers/          # Cloudflare Worker entrypoints (cron, workflow)
├── supabase/         # Migrations
├── wrangler.jsonc    # Cloudflare config
└── open-next.config.ts
```

## コマンド

```bash
pnpm dev              # 開発サーバー起動
pnpm build            # Next.js ビルド
pnpm lint:fix         # Biome lint + 自動修正
pnpm typecheck        # TypeScript 型チェック
pnpm deploy           # Cloudflare Workers デプロイ
```

## コーディングルール

詳細は skills の `architecture` および `ts-conventions` を参照。

## スキル

- `/db-migration <name>` — Supabase マイグレーション作成
- `/new-feature <name>` — Web 新機能スキャフォールド
- `/new-agent <name>` — エージェントモジュールスキャフォールド
- `/commit` — 品質チェック + コミット
