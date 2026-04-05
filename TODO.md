# Lantern — MVP タスク管理

## 完了済み

- [x] **1. プロジェクト基盤** — Next.js 15, Tailwind v4, React Compiler, Biome
- [x] **2. Supabase + DB スキーマ** — 初期6テーブル + マルチテナント組織対応
- [x] **3. エージェントパイプライン** — @cloudflare/playwright による collector, analyst, battle-card (Claude API), delivery (Resend)
- [x] **4. Cloudflare 移行** — monorepo 解消、OpenNext + Workers + Browser Rendering + Cron Triggers
- [x] **5. マルチテナント認証設計** — organizations, org_members, invitations, RLS, トリガー
- [x] **6. Auth** — ミドルウェア、ログイン/サインアップ、auth callback
- [x] **7. 組織管理 API** — CRUD、メンバー管理、競合管理、プラン上限チェック
- [x] **8. 招待システム** — 招待作成/受諾/取消 API、メール送信、受諾ページ
- [x] **9. 共通ヘルパー** — requireUser, zodErrorResponse, setLastActiveOrg, check_email_is_org_member RPC

---

## 残タスク

### 10. フロントエンド UI

#### 10-1. 共通レイアウト
- [ ] `(app)/layout.tsx` — ユーザー取得 + UserContext
- [ ] `(app)/[orgSlug]/layout.tsx` — org 取得 + メンバー検証 + OrgContext
- [ ] サイドバーナビゲーション（Dashboard, Settings, Billing）
- [ ] ヘッダー（org switcher, ユーザーメニュー, ログアウト）
- [ ] レスポンシブ対応
- [ ] Atlassian Design System ベーススタイル

#### 10-2. ダッシュボード
- [ ] 週次ダイジェスト一覧 (`/[orgSlug]/dashboard`)
- [ ] ダイジェスト詳細表示（Markdown レンダリング）
- [ ] 「今週のトップ変更」サマリー
- [ ] 競合ごとのフィルタリング

#### 10-3. 設定ページ
- [ ] 競合リスト管理 (`/[orgSlug]/settings/competitors`) — 追加/削除
- [ ] 配信チャネル設定 (`/[orgSlug]/settings/delivery`) — Email on/off, Slack/Discord webhook URL
- [ ] メンバー管理 (`/[orgSlug]/settings/members`) — 一覧、招待、ロール変更、削除

#### 10-4. 初回サインアップフロー
- [ ] 組織作成フォーム（初回ログイン時）
- [ ] 組織作成後のダッシュボードリダイレクト

---

### 11. Stripe 決済

- [ ] Stripe Products/Prices 作成（Free, Starter, Pro, Team）
- [ ] 課金ページ (`/[orgSlug]/billing`)
- [ ] Checkout Session 作成 API (`/api/stripe/checkout`)
- [ ] Webhook 処理 (`/api/stripe/webhook`) — プラン変更を organizations に反映
- [ ] カスタマーポータルリンク

---

### 12. Cloudflare Workflow 実装

- [ ] `workers/pipeline.ts` — Workflow ステップ定義（collect → analyze → battlecard → deliver）
- [ ] `setBrowserBinding(env.BROWSER)` の接続
- [ ] 週次 Cron（毎週月曜 06:00 UTC）でパイプライン実行
- [ ] 日次 Cron（08:00 UTC）で Pro/Team 向けアラートチェック
- [ ] wrangler.jsonc の secrets 設定ドキュメント

---

## 参考: MVP スコープ

- Cloud Security SaaS 20社固定リスト
- Collector: website diff + G2 reviews
- 配信: Email のみ（Slack/Discord は Phase 2）
- 手動オンボーディング（最初の10ベータユーザー無料）
- ホスティング: Cloudflare Workers（Next.js + エージェント）
