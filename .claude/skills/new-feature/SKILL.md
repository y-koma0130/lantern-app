---
name: new-feature
description: Web フロントエンド新機能のスキャフォールド
user-invocable: true
argument-hint: <feature-name>
---

# 新機能スキャフォールド

`$ARGUMENTS` feature を作成する。

## 1. ディレクトリ作成

```bash
mkdir -p src/features/$ARGUMENTS/{components,hooks,stores}
```

## 2. ページコンポーネント作成

`src/features/$ARGUMENTS/components/$ARGUMENTS-page.tsx` を作成する。

```tsx
export function [PascalCase]Page() {
  return (
    <div>
      <h1>[Feature Name]</h1>
    </div>
  );
}
```

- `$ARGUMENTS` を PascalCase に変換してコンポーネント名とする
- kebab-case のままファイル名とする

## 3. app/ にルート追加

`app/$ARGUMENTS/page.tsx` を作成する。

```tsx
import { [PascalCase]Page } from "@/features/$ARGUMENTS/components/$ARGUMENTS-page";

export default function Page() {
  return <[PascalCase]Page />;
}
```

## 4. チェックリスト

- [ ] ディレクトリ構造が `src/features/$ARGUMENTS/` 配下にあるか
- [ ] `app/` のページは feature コンポーネントを import しているだけか
- [ ] ファイル名が kebab-case か
- [ ] コンポーネント名が PascalCase か
- [ ] `any` を使っていないか
- [ ] barrel export を作っていないか
- [ ] `pnpm lint:fix && pnpm typecheck` が通るか
