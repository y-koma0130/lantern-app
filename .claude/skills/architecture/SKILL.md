---
name: architecture
description: プロジェクト構造・レイヤー設計・配置ルールのガイド
user-invocable: false
---

# Lantern アーキテクチャガイド

## プロジェクト構成

```
lantern-app/
├── app/                          # Next.js App Router pages (thin wrappers only!)
│   ├── (auth)/                   # ログイン・サインアップ
│   ├── (app)/                    # 認証済みアプリシェル
│   │   └── [orgSlug]/            # 組織スコープページ
│   │       ├── dashboard/        # ダイジェスト閲覧
│   │       └── settings/         # 配信設定・競合管理
│   ├── api/                      # Route Handlers
│   ├── invite/                   # 公開招待ページ
│   ├── onboarding/               # 組織作成
│   └── auth/callback/            # Auth コールバック
├── src/
│   ├── components/               # 共通 UI コンポーネント
│   ├── features/                 # Feature モジュール
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── invite/
│   │   ├── layout/
│   │   ├── onboarding/
│   │   └── settings/
│   │       └── [feature]/
│   │           ├── components/   # feature 固有コンポーネント
│   │           ├── hooks/        # feature 固有フック
│   │           ├── stores/       # feature 固有ストア
│   │           ├── types.ts      # feature 固有の型定義
│   │           └── constants.ts  # feature 固有の定数
│   ├── hooks/                    # 共通フック
│   ├── stores/                   # 共通グローバルストア (Jotai)
│   └── lib/
│       ├── supabase/             # client.ts, server.ts, admin.ts, middleware.ts, env.ts
│       ├── queries/              # 共有サーバーサイドクエリヘルパー
│       ├── api.ts                # API ルートヘルパー (requireUser, zodErrorResponse)
│       └── email.ts              # Resend メールユーティリティ
├── agents/                       # エージェントパイプライン
│   ├── collector/
│   ├── analyst/
│   ├── battle-card/
│   ├── delivery/
│   └── shared/
│       ├── db.ts                 # Supabase client
│       ├── types.ts              # 共通型定義
│       └── database.types.ts     # Supabase 自動生成型
├── workers/                      # Cloudflare Worker エントリーポイント
├── supabase/
│   └── migrations/
├── wrangler.jsonc                # Cloudflare 設定
├── open-next.config.ts
├── next.config.ts
├── package.json                  # 単一パッケージ（モノレポではない）
└── tsconfig.json
```

## ホスティング

- **Cloudflare Workers** via OpenNext
- `workers/` に Cloudflare Worker エントリーポイント（cron, workflow 等）
- `wrangler.jsonc` で Cloudflare 設定を管理

## 配置ルール

### どこに置くか判断する

1. **特定 feature でのみ使う** → `src/features/[feature]/` 配下
2. **複数 feature で共有する** → `src/components/`, `src/hooks/`, `src/stores/`
3. **インフラ・ユーティリティ** → `src/lib/`
4. **サーバーサイド共有クエリ** → `src/lib/queries/`
5. **エージェント固有** → `agents/[agent]/`
6. **エージェント間で共有** → `agents/shared/`

### app/ ディレクトリのルール

- `app/` 内の `page.tsx`, `layout.tsx` にはページコンテンツの詳細を含めない
- feature 内のコンポーネントを import して配置するだけにする（thin wrapper）

```tsx
// app/(app)/[orgSlug]/dashboard/page.tsx
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";

export default function Page() {
  return <DashboardPage />;
}
```

### Supabase クライアントの使い分け

| クライアント | 用途 | ファイル |
|-------------|------|---------|
| `createClient` | Server Component / Route Handler でのユーザー認証付きアクセス | `src/lib/supabase/server.ts` |
| `createAdminClient` | API Route での DB 書き込み（service role、RLS バイパス） | `src/lib/supabase/admin.ts` |
| `createBrowserClient` | クライアントサイドアクセス | `src/lib/supabase/client.ts` |

- **認証チェック:** `createClient()` → `getUser()` で認証確認
- **DB 書き込み（API Routes）:** `createAdminClient()` で service role クライアントを使用

## バックエンドレイヤー設計

エージェントランタイムは軽量 DDD に従う。

| 層 | 責務 | 例 |
|----|------|----|
| **Repository** | データアクセス。Supabase 依存はここに閉じる | `collector/repository.ts` |
| **Service** | ビジネスロジック | `analyst/scorer.ts` |
| **Application / Usecase** | エントリーポイント。Service 層を組み合わせる | `collector/index.ts` |
