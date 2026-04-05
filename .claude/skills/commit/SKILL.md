---
name: commit
description: コード品質チェック + コミットワークフロー
user-invocable: true
disable-model-invocation: true
---

# コミットワークフロー

## 1. 品質チェック

```bash
pnpm lint:fix
pnpm typecheck
```

エラーがあれば修正してから次へ進む。

## 2. 差分確認

```bash
git diff
git diff --staged
```

差分を確認し、意図しない変更がないか確認する。

## 3. ステージング

個別にファイルを指定する。`git add .` は使わない。

```bash
git add [file1] [file2] ...
```

**除外:** `.env`, `.env.*`, 認証情報を含むファイルは絶対にコミットしない。

## 4. コミットメッセージ

### フォーマット

```
prefix: 変更の要約（50文字以内）

必要に応じて詳細を記述
```

### prefix 一覧

| prefix | 用途 |
|--------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `refactor` | リファクタリング |
| `chore` | 設定・依存関係等 |
| `docs` | ドキュメント |
| `test` | テスト |
| `style` | フォーマット変更 |

## 5. 確認

```bash
git status
git log --oneline -3
```
