# Lantern — MVP タスク管理

## 完了済み

- [x] **1. プロジェクト基盤** — monorepo (pnpm workspace), Next.js 15, agents パッケージ, Biome, Tailwind v4, React Compiler
- [x] **2. Supabase + DB スキーマ** — 6テーブル (subscribers, competitors, competitor_snapshots, insights, digests, delivery_logs)
- [x] **3. エージェントパイプライン** — Playwright による collector, analyst (differ + scorer), battle-card (Claude API), delivery (Resend)

---

## 4. Web フロントエンド

### 4-1. Auth（認証）
- [ ] Supabase Auth セットアップ（Email/Password）
- [ ] ミドルウェア（認証チェック + リダイレクト）
- [ ] ログインページ (`/login`)
- [ ] サインアップページ (`/signup`)
- [ ] サインアップ後に subscribers テーブルにレコード作成

### 4-2. 共通レイアウト
- [ ] サイドバーナビゲーション（Dashboard, Settings, Billing）
- [ ] ヘッダー（ユーザーメニュー, ログアウト）
- [ ] レスポンシブ対応
- [ ] Atlassian Design System 準拠のベーススタイル

### 4-3. ダッシュボード
- [ ] 週次ダイジェスト一覧ページ (`/dashboard`)
- [ ] ダイジェスト詳細表示（Markdown レンダリング）
- [ ] 「今週のトップ3変更」サマリー表示
- [ ] 競合ごとのフィルタリング

### 4-4. 設定ページ
- [ ] 競合リスト管理 (`/settings/competitors`) — 追加/削除
- [ ] 配信チャネル設定 (`/settings/delivery`) — Email on/off, Slack/Discord webhook URL
- [ ] プロフィール設定 (`/settings/profile`) — メールアドレス変更等

---

## 5. Stripe 決済

- [ ] Stripe Products/Prices 作成（Free, Starter, Pro, Team）
- [ ] チェックアウトページ (`/billing`)
- [ ] Stripe Checkout Session 作成 API (`/api/stripe/checkout`)
- [ ] Stripe Webhook 処理 (`/api/stripe/webhook`) — プラン変更を subscribers に反映
- [ ] カスタマーポータルリンク（プラン変更/キャンセル）

---

## 6. Cron スケジューリング

- [ ] node-cron でパイプラインの週次実行（毎週月曜 06:00 UTC）
- [ ] Pro/Team プラン向け日次アラートチェック（08:00 UTC, importance_score >= 8）
- [ ] 実行ログ出力
- [ ] エントリーポイント (`packages/agents/scheduler.ts`)

---

## 参考: MVP スコープ

- Cloud Security SaaS 20社固定リスト
- Collector: website diff + G2 reviews
- 配信: Email のみ（Slack/Discord は Phase 2）
- 手動オンボーディング（最初の10ベータユーザー無料）
