# Lantern — ローカルテストチェックリスト

## 前提条件

- `supabase start` でローカル Supabase 起動済み
- `pnpm dev` で Next.js dev server 起動済み（http://localhost:3000）
- `stripe listen --forward-to localhost:3000/api/stripe/webhook` 起動済み
- `.env.local` に全環境変数設定済み

---

## 1. 認証フロー

- [✔︎] `/signup` — ユーザー作成 → `/` にリダイレクト
- [✔︎] `/login` — ログイン → ダッシュボードにリダイレクト
- [✔︎] `/` — 未認証 → `/login` にリダイレクト
- [✔︎] `/` — 認証済み + 組織あり → org ダッシュボードにリダイレクト
- [✔︎] `/` — 認証済み + 組織なし → `/onboarding` にリダイレクト
- [✔︎] ログアウトボタン → `/login` にリダイレクト
- [✔︎] 認証済みで `/login` にアクセス → `/` にリダイレクト

---

## 2. 組織管理

- [✔︎] `/onboarding` — 組織名 + slug 入力 → 作成 → ダッシュボードにリダイレクト
- [✔︎] slug バリデーション — 英小文字・数字・ハイフンのみ受け付ける
- [ ] 重複 slug → エラーメッセージ表示
- [ ] Org switcher — ヘッダーのドロップダウンから組織切り替え
- [ ] Org switcher — 「Create new organization」リンクが `/onboarding` に遷移

---

## 3. ダッシュボード

- [✔︎] `/[orgSlug]/dashboard` — 空の状態が正しく表示（insights なし、digests なし）
- [✔︎] Export Insights CSV ボタン — Free プランで alert 表示（403）
- [✔︎] Export Digests CSV ボタン — Free プランで alert 表示（403）
- [✔︎] サイドバーのナビゲーション — Dashboard, Settings, Billing の各リンクが正しく遷移
- [✔︎] サイドバーの Settings 展開 → Competitors, Delivery, Members サブメニュー

---

## 4. Settings > Competitors

- [ ] 競合追加フォーム — name, website, niche を入力 → 追加
- [ ] 競合リストに追加した競合が表示される
- [ ] 競合削除 — Delete → 確認 → 削除
- [ ] 上限チェック — Free プラン（3社）を超えるとエラー
- [ ] Member ロールでは追加フォーム/削除ボタンが非表示

---

## 5. Settings > Delivery

- [ ] Email toggle — ON/OFF 切り替え
- [ ] Slack webhook URL 入力欄 — Free プランで disabled + アップグレードメッセージ
- [ ] Discord webhook URL 入力欄 — Free プランで disabled + アップグレードメッセージ
- [ ] Slack Test ボタン — URL 入力後に表示、クリックでテストメッセージ送信
- [ ] Discord Test ボタン — 同上
- [ ] Digest frequency — weekly / monthly 切り替え
- [ ] Save Settings → 成功メッセージ表示
- [ ] ヘルプテキスト — Slack / Discord の Webhook URL 取得手順が表示

---

## 6. Settings > Members

- [ ] メンバー一覧 — 自分（Owner）が表示される
- [ ] 「You」バッジが表示される
- [ ] Member ロールでは招待フォーム/ロール変更/削除 UI が非表示

---

## 7. 招待システム

- [ ] 招待フォーム — メールアドレス入力 → Send Invite
- [ ] Resend 経由でメール送信 — `noreply@lanternci.com` から届く
- [ ] Pending Invitations リストに表示される
- [ ] 招待取り消し（Revoke）→ リストから消える
- [ ] `/invite/[token]` — 未認証でアクセス → ログイン/サインアップリンク表示
- [ ] `/invite/[token]` — 認証済み + メール一致 → Accept & Join ボタン表示
- [ ] 招待受諾 → 組織に参加 → ダッシュボードにリダイレクト
- [ ] 受諾後、Settings > Members に新メンバーが表示される
- [ ] メンバー上限チェック — Free プラン（1人）で招待不可

---

## 8. Billing

### プラン表示
- [✔︎] `/[orgSlug]/billing` — 現在のプラン名が表示される
- [✔︎] Monthly / Yearly トグル — 価格表示が切り替わる
- [✔︎] 4つのプランカードが表示 — Free, Starter, Pro, Team
- [✔︎] 各プランカードの機能一覧が正しい（下表と照合）

| 機能 | Free | Starter | Pro | Team |
|------|------|---------|-----|------|
| 月額 | $0 | $79 | $199 | $399 |
| 年額 | — | $790 | $1,990 | $3,990 |
| 競合数 | 3 | 10 | 20 | 50 |
| ユーザー数 | 1 | 3 | 10 | 25 |
| 配信 | Monthly | Weekly | Weekly + daily | Weekly + daily |
| Email | ✅ | ✅ | ✅ | ✅ |
| Slack/Discord | ❌ | ✅ | ✅ | ✅ |
| Battle cards | ❌ | ❌ | ✅ | ✅ |
| CSV export | ❌ | ❌ | ✅ | ✅ |
| Archive | 7日 | 30日 | 90日 | 無制限 |
| サポート | Community | Email | Priority | Priority |

### 決済フロー
- [ ] Upgrade ボタン → Stripe Checkout 画面に遷移
- [✔︎] テストカード `4242 4242 4242 4242`（有効期限: 任意の未来日、CVC: 任意3桁）
- [✔︎] 決済成功 → billing ページに戻り → 「Subscription activated!」バナー
- [✔︎] `stripe listen` に Webhook イベントが表示される
- [✔︎] 現在のプランが更新されている（例: Free → Starter）
- [ ] Manage Subscription ボタン → Stripe Customer Portal に遷移

### プラン変更後の認可
- [ ] Starter アップグレード後 → Delivery Settings で Slack/Discord が有効化
- [✔︎] Pro アップグレード後 → CSV エクスポートが動作
- [ ] Pro アップグレード後 → 競合上限が 20 に増加
- [ ] Stripe Portal でキャンセル → Free に戻る → 機能制限が再適用

---

## 9. レスポンシブ

- [ ] モバイル幅（375px）でサイドバーが非表示
- [ ] ハンバーガーメニューでサイドバー表示/非表示
- [ ] モバイルでフォーム入力が正しく動作
- [ ] Billing のプランカードがモバイルで1列表示

---

## 10. エラーハンドリング

- [ ] 存在しない orgSlug → リダイレクト（404 ではなくフォールバック）
- [ ] 所属していない org → リダイレクト
- [ ] API エラー時にフォームにエラーメッセージが表示される
- [ ] ネットワークエラー時に「Something went wrong」メッセージ
