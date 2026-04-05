# Lantern

サイバーセキュリティ SaaS 企業向けの自動競合インテリジェンス SaaS。

## 技術スタック

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (Postgres + Auth + RLS)
- **Agent Runtime:** TypeScript + Anthropic SDK + node-cron
- **Email:** Resend
- **Notifications:** Slack Webhook, Discord Webhook
- **Payments:** Stripe
- **Hosting:** EC2 (agents), Vercel (web)
- **UI:** Tailwind CSS, Atlassian Design System 準拠
- **State:** Jotai
- **Validation:** Zod
- **Linter/Formatter:** Biome
- **React:** React Compiler 使用

## コマンド

```bash
pnpm install          # 依存関係インストール
pnpm dev              # 開発サーバー起動
pnpm build            # ビルド
pnpm lint:fix         # Biome lint + 自動修正
pnpm typecheck        # TypeScript 型チェック
pnpm supabase db push # マイグレーション適用
pnpm supabase db reset # DB リセット
```

## コーディングルール

詳細は skills の `architecture` および `ts-conventions` を参照。

## スキル

- `/db-migration <name>` — Supabase マイグレーション作成
- `/new-feature <name>` — Web 新機能スキャフォールド
- `/new-agent <name>` — エージェントモジュールスキャフォールド
- `/commit` — 品質チェック + コミット
