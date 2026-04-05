---
name: new-agent
description: エージェントモジュールのスキャフォールド
user-invocable: true
argument-hint: <agent-name>
---

# 新エージェントスキャフォールド

`$ARGUMENTS` エージェントを作成する。

## 1. ディレクトリ作成

```bash
mkdir -p packages/agents/$ARGUMENTS
```

## 2. エントリーポイント作成

`packages/agents/$ARGUMENTS/index.ts` を作成する。

```ts
export async function run[PascalCase](): Promise<void> {
  // TODO: 実装
}
```

## 3. Repository 層（DB アクセスが必要な場合）

`packages/agents/$ARGUMENTS/repository.ts` を作成する。DB アクセスはこの層に閉じる。

## 4. 型定義

共有型は `packages/agents/shared/types.ts` に追加する。

## 5. チェックリスト

- [ ] エントリーポイントが `index.ts` にあるか
- [ ] DB アクセスが Repository 層に閉じているか
- [ ] ビジネスロジックが Service 層に分離されているか
- [ ] 共有型が `shared/types.ts` に定義されているか
- [ ] `pnpm lint:fix && pnpm typecheck` が通るか
