---
name: architecture
description: プロジェクト構造・レイヤー設計・配置ルールのガイド
user-invocable: false
---

# Lantern アーキテクチャガイド

## プロジェクト構成

```
lantern-app/
├── apps/
│   └── web/                        # Next.js 15 (App Router)
│       ├── app/
│       │   ├── (auth)/             # ログイン・サインアップ
│       │   ├── dashboard/          # ダイジェスト閲覧
│       │   ├── settings/           # 配信設定・競合管理
│       │   └── api/                # Route Handlers (Stripe Webhook等)
│       └── src/
│           ├── components/         # 共通コンポーネント
│           ├── hooks/              # 共通フック
│           ├── stores/             # 共通グローバルストア (Jotai)
│           ├── lib/                # ユーティリティ・Supabase client等
│           └── features/
│               └── [feature]/
│                   ├── components/ # feature固有コンポーネント
│                   ├── hooks/      # feature固有フック
│                   ├── stores/     # feature固有ストア
│                   ├── types.ts    # feature固有の型定義
│                   └── constants.ts # feature固有の定数
├── packages/
│   └── agents/                     # エージェントランタイム (TypeScript)
│       ├── collector/
│       │   ├── index.ts
│       │   ├── repository.ts
│       │   └── sources/
│       │       ├── website.ts
│       │       └── g2.ts
│       ├── analyst/
│       │   ├── index.ts
│       │   ├── repository.ts
│       │   ├── scorer.ts
│       │   └── differ.ts
│       ├── battle-card/
│       │   ├── index.ts
│       │   ├── prompt.ts
│       │   └── formatter.ts
│       ├── delivery/
│       │   ├── index.ts
│       │   └── email.ts
│       └── shared/
│           ├── db.ts               # Supabase client
│           └── types.ts            # 共通型定義
├── supabase/
│   └── migrations/
├── package.json                    # pnpm workspace root
└── CLAUDE.md
```

## 配置ルール

### どこに置くか判断する

1. **特定featureでのみ使う** → `src/features/[feature]/` 配下
2. **複数featureで共有する** → `src/components/`, `src/hooks/`, `src/stores/`
3. **インフラ・ユーティリティ** → `src/lib/`
4. **エージェント固有** → `packages/agents/[agent]/`
5. **エージェント間で共有** → `packages/agents/shared/`

### app/ ディレクトリのルール

- `app/` 内の `page.tsx`, `layout.tsx` にはページコンテンツの詳細を含めない
- feature内のコンポーネントを import して配置するだけにする

```tsx
// app/dashboard/page.tsx
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";

export default function Page() {
  return <DashboardPage />;
}
```

## バックエンドレイヤー設計

エージェントランタイムは軽量DDDに従う。

| 層 | 責務 | 例 |
|----|------|----|
| **Repository** | データアクセス。Supabase依存はここに閉じる | `collector/repository.ts` |
| **Service** | ビジネスロジック | `analyst/scorer.ts` |
| **Application / Usecase** | エントリーポイント。Service層を組み合わせる | `collector/index.ts` |
