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

単一パッケージ構成（モノレポではない）。

```
lantern-app/
├── app/              # Next.js App Router pages (thin wrappers only!)
│   ├── (auth)/       # ログイン・サインアップ
│   ├── (app)/        # 認証済みアプリシェル ([orgSlug] スコープ)
│   ├── api/          # Route Handlers
│   ├── invite/       # 公開招待ページ
│   ├── onboarding/   # 組織作成
│   └── auth/callback/
├── src/
│   ├── components/   # 共通 UI コンポーネント
│   ├── features/     # Feature モジュール (auth, dashboard, invite, layout, onboarding, settings)
│   ├── hooks/        # 共通フック
│   ├── stores/       # 共通グローバルストア (Jotai)
│   └── lib/          # ユーティリティ (supabase/, queries/, api.ts, email.ts)
├── agents/           # エージェントパイプライン (collector, analyst, battle-card, delivery)
├── workers/          # Cloudflare Worker エントリーポイント (cron, workflow)
├── supabase/         # マイグレーション
├── wrangler.jsonc    # Cloudflare 設定
├── open-next.config.ts
└── package.json
```

## コマンド

```bash
pnpm dev              # 開発サーバー起動
pnpm build            # Next.js ビルド
pnpm lint:fix         # Biome lint + 自動修正
pnpm typecheck        # TypeScript 型チェック
pnpm deploy           # Cloudflare Workers デプロイ
```

## Supabase クライアントパターン

- **認証チェック:** `createClient()` (server.ts) → `getUser()` で認証確認
- **DB 書き込み（API Routes）:** `createAdminClient()` (admin.ts) で service role クライアントを使用（RLS バイパス）
- **クライアントサイド:** `createBrowserClient()` (client.ts)

## コーディングルール

詳細は skills の `architecture` および `ts-conventions` を参照。

## スキル

- `/db-migration <name>` — Supabase マイグレーション作成
- `/new-feature <name>` — Web 新機能スキャフォールド
- `/new-agent <name>` — エージェントモジュールスキャフォールド
- `/commit` — 品質チェック + コミット
