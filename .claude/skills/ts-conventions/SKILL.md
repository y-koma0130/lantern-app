---
name: ts-conventions
description: TypeScript・Biome・React コーディング規約
user-invocable: false
---

# TypeScript コーディング規約

## 型定義

### interface を使う（オブジェクト型）

```ts
// OK
interface DigestProps {
  competitorName: string;
  weekOf: Date;
}

// NG
type DigestProps = {
  competitorName: string;
  weekOf: Date;
};
```

### type を使う（ユニオン・エイリアス）

```ts
type Channel = "email" | "slack" | "discord";
type InsightType = "pricing" | "feature" | "hiring" | "funding" | "sentiment" | "messaging";
```

## 禁止事項

### any 禁止

```ts
// NG
function parse(data: any) { ... }

// OK
function parse(data: unknown) { ... }
```

### 不要なキャスト禁止

```ts
// NG — 型が自明な場合のキャスト
const name = getName() as string;

// OK — 型が不明確な場合のみ型ガードを使う
if (typeof value === "string") {
  // value は string
}
```

### barrel export 禁止

```ts
// NG — index.ts で re-export しない
export { ScoreCard } from "./score-card";
export { DigestView } from "./digest-view";

// OK — 各ファイルから直接 import する
import { ScoreCard } from "@/features/dashboard/components/score-card";
```

## import ルール

### import type を使う

型のみの import には `import type` を使用する。

```ts
import type { Competitor } from "../shared/types";
```

### パスエイリアス

Web アプリでは `@/` を使用する。

```ts
import { Button } from "@/components/button";
import type { Subscriber } from "@/features/settings/types";
```

## 命名規則

| 対象 | 規則 | 例 |
|------|------|----|
| コンポーネントファイル | kebab-case | `score-card.tsx` |
| コンポーネント名 | PascalCase | `ScoreCard` |
| 非コンポーネントファイル | kebab-case | `use-digest.ts`, `scorer.ts` |
| interface / type | PascalCase | `DigestProps`, `Channel` |
| 関数 / 変数 | camelCase | `fetchReviews`, `insightScore` |
| 定数 | UPPER_SNAKE_CASE | `MAX_COMPETITORS` |
| ディレクトリ | kebab-case | `battle-card/` |

## React コンポーネント

### props は interface で定義

```tsx
interface CompetitorCardProps {
  name: string;
  score: number;
  lastUpdated: Date;
}

export function CompetitorCard({ name, score, lastUpdated }: CompetitorCardProps) {
  return (
    <div>
      <h3>{name}</h3>
      <span>{score}</span>
    </div>
  );
}
```

### React.FC は使わない

```tsx
// NG
const Card: React.FC<CardProps> = ({ title }) => { ... };

// OK
export function Card({ title }: CardProps) { ... }
```

### React Compiler

React Compiler を使用する。手動の `useMemo`, `useCallback`, `React.memo` は原則不要。
パフォーマンス問題が明確な場合のみ手動最適化を検討する。

## Zod バリデーション

外部入力（API レスポンス、フォーム入力、Webhook ペイロード）は Zod でバリデーションする。

```ts
import { z } from "zod";

const subscriberSchema = z.object({
  email: z.string().email(),
  plan: z.enum(["free", "starter", "pro", "team"]),
  channelEmail: z.boolean(),
  channelSlack: z.string().url().nullable(),
});

type SubscriberInput = z.infer<typeof subscriberSchema>;
```

## エラーハンドリング

- 境界（API、外部サービス呼び出し）でのみ catch する
- 内部コードでは例外をそのまま伝播させる
- エージェント内では Result パターンを検討する

```ts
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Biome 設定

- インデント: タブ
- クォート: ダブルクォート
- セミコロン: あり
- 末尾カンマ: all
- 行幅: 100
