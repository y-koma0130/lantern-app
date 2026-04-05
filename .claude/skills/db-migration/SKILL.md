---
name: db-migration
description: Supabase マイグレーション作成手順
user-invocable: true
argument-hint: <migration-name>
disable-model-invocation: true
---

# Supabase マイグレーション作成

## 手順

### 1. マイグレーションファイル作成

```bash
pnpm supabase migration new $ARGUMENTS
```

### 2. SQL を記述

以下の規約に従う:

- テーブル名: `snake_case`（複数形）
- カラム名: `snake_case`
- 主キー: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- タイムスタンプ: `timestamptz` を使用（`timestamp` ではない）
- `created_at timestamptz DEFAULT now()` を必ず含める
- RLS（Row Level Security）を必ず有効化する

### SQL テンプレート

```sql
-- テーブル作成
CREATE TABLE IF NOT EXISTS table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- カラム定義
  created_at timestamptz DEFAULT now()
);

-- RLS 有効化
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー
CREATE POLICY "説明" ON table_name
  FOR SELECT
  USING (auth.uid() = user_id);

-- インデックス（必要に応じて）
CREATE INDEX IF NOT EXISTS idx_table_name_column ON table_name (column);
```

### 3. ローカルに適用

```bash
pnpm supabase db push
```

または全リセット:

```bash
pnpm supabase db reset
```

### 4. TypeScript 型を再生成

```bash
pnpm supabase gen types typescript --local > packages/agents/shared/database.types.ts
```

### 5. 確認チェックリスト

- [ ] RLS が有効化されているか
- [ ] 必要な RLS ポリシーが定義されているか
- [ ] インデックスが必要なカラムに設定されているか
- [ ] 型が再生成されているか
