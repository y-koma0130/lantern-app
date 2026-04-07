import type { Insight } from "../shared/types.js";

type DetailFormatter = (detail: Record<string, unknown>) => string | null;

/** Formatters applied in order; each returns a line (without leading \n) or null to skip. */
const DETAIL_FORMATTERS: DetailFormatter[] = [
	// Website fields
	(d) =>
		Array.isArray(d.headings)
			? `Key sections: ${(d.headings as string[]).slice(0, 10).join(" | ")}`
			: null,
	(d) => (d.bodyPreview ? `Content preview: ${d.bodyPreview}` : null),
	(d) => (d.metaDescription ? `Meta: ${d.metaDescription}` : null),
	(d) => (Array.isArray(d.added) ? `Added: ${(d.added as string[]).join(", ")}` : null),
	(d) => (Array.isArray(d.removed) ? `Removed: ${(d.removed as string[]).join(", ")}` : null),
	(d) =>
		d.previous !== undefined && d.current !== undefined
			? `Before: ${String(d.previous).slice(0, 200)}\n    After: ${String(d.current).slice(0, 200)}`
			: null,

	// G2 sentiment fields
	(d) =>
		Array.isArray(d.topKeywords)
			? `Top keywords: ${(d.topKeywords as { word: string; count: number; sentiment: string }[]).map((k) => `${k.word} (${k.sentiment}, ${k.count}x)`).join(", ")}`
			: null,
	(d) =>
		Array.isArray(d.emergingThemes)
			? `Emerging themes: ${(d.emergingThemes as string[]).join(", ")}`
			: null,
	(d) =>
		Array.isArray(d.signals) ? `Sales signals: ${(d.signals as string[]).join(" | ")}` : null,
	(d) => (d.theme ? `Emerging theme: ${d.theme}` : null),
	(d) =>
		d.keyword ? `Keyword: "${d.keyword}" (${d.previousCount} → ${d.currentCount} mentions)` : null,

	// HN fields
	(d) => {
		if (!d.storyId) return null;
		let line = `HN Story: ${d.title} (${d.points} points, ${d.numComments} comments)`;
		if (d.url) line += `\n    URL: ${d.url}`;
		return line;
	},
	(d) =>
		Array.isArray(d.stories)
			? `Stories: ${(d.stories as { title: string; points: number }[]).map((s) => `"${s.title}" (${s.points}pt)`).join(", ")}`
			: null,

	// Crunchbase fields
	(d) => {
		if (!d.roundName) return null;
		let line = `Round: ${d.roundName}`;
		if (d.amount) line += ` — ${d.amount}`;
		if (Array.isArray(d.leadInvestors)) {
			line += `\n    Lead investors: ${(d.leadInvestors as string[]).join(", ")}`;
		}
		return line;
	},
	(d) => (d.totalFunding ? `Total funding: ${d.totalFunding}` : null),
	(d) => (d.employeeRange ? `Employees: ${d.employeeRange}` : null),
	(d) => {
		if (!Array.isArray(d.fundingRounds)) return null;
		const rounds = d.fundingRounds as { roundName: string; amount: string | null; date: string }[];
		return rounds.length > 0
			? `Funding history: ${rounds.map((r) => `${r.roundName} ${r.amount ?? ""} (${r.date})`).join(", ")}`
			: null;
	},
	(d) =>
		Array.isArray(d.news)
			? `Press: ${(d.news as { title: string }[]).map((n) => n.title).join(", ")}`
			: null,
];

function formatDetail(detail: Record<string, unknown>): string {
	const lines: string[] = [];
	for (const fmt of DETAIL_FORMATTERS) {
		const line = fmt(detail);
		if (line != null) lines.push(line);
	}
	return lines.length > 0 ? `\n    ${lines.join("\n    ")}` : "";
}

export function buildPrompt(insights: Insight[]): string {
	const isBaseline = insights.some((i) => i.summary.startsWith("[Baseline]"));

	const insightBlocks = insights
		.map((insight) => {
			const detail = insight.diffDetail as Record<string, unknown>;
			const detailStr = formatDetail(detail);
			return `- [${insight.type.toUpperCase()}] (score: ${insight.importanceScore}) ${insight.summary}${detailStr}`;
		})
		.join("\n\n");

	if (isBaseline) {
		return buildBaselinePrompt(insightBlocks);
	}

	return buildChangePrompt(insightBlocks);
}

function buildBaselinePrompt(insightBlocks: string): string {
	return `You are a senior competitive intelligence analyst specialising in cybersecurity SaaS.
You produce reports in Japanese for sales and product teams.

This is the FIRST analysis of these competitors. Create a comprehensive competitive landscape overview based on the initial data.

## Collected Data

${insightBlocks}

## Instructions

Create a battle card digest in Markdown. Output ALL text in Japanese.

### 1. 競合ランドスケープ概要
- 各競合のポジショニングをWebサイトコンテンツに基づいてまとめる
- 主要な価値提案とターゲット顧客を特定する
- 価格アプローチ（価格ページのデータがある場合）

### 2. 競合プロファイル
データがある各競合について:
- **ポジショニング**: 何を主張し、誰をターゲットにしているか
- **主要機能**: 機能ページからの注目すべき機能
- **価格シグナル**: 見つかった価格指標
- **G2センチメント**: レビューから見える顧客の声（データがある場合）
- **資金・体力**: 調達状況・従業員規模（Crunchbase データがある場合）
- **市場の声**: HackerNews での言及傾向（データがある場合）

### 3. 戦略的所見
- 競合横断での市場トレンド
- 市場のギャップや機会
- 意外なポジショニングやメッセージング

### 4. 推奨事項
- 今後の分析で注目すべき点
- 競合差別化のための提案
- 営業チームが準備すべき質問

具体的なデータを引用すること。汎用的なアドバイスは書かない。`;
}

function buildChangePrompt(insightBlocks: string): string {
	return `You are a senior competitive intelligence analyst specialising in cybersecurity SaaS.
You produce weekly digests in Japanese for sales and product teams.

Based on the following competitive intelligence collected this week, generate an actionable digest.

## Collected Intelligence

${insightBlocks}

## Instructions

Create a weekly digest in Markdown. Output ALL text in Japanese.
Include ONLY sections that have relevant data — omit empty sections entirely.
Put the highest-impact section first.

### Available sections (include only when data exists):

#### G2 センチメント速報
- 新着レビュー数と評価トレンドの変化
- 頻出キーワードの変化（特にネガティブキーワードの急増に注目）
- 営業トークへの具体的な示唆
- フォーマット例: 「競合X社のレビューで『○○』への言及が急増。先月まではゼロ → △△を訴求するタイミング」

#### メンション・ニュース
- HackerNews・Reddit での言及サマリー
- エンゲージメント（ポイント数・コメント数）を含める
- 市場の声の要約と示唆

#### 調達・M&A
- 資金調達ラウンドの詳細（金額、ラウンド名、リード投資家）
- 従業員数の変化
- 競合の体力・成長フェーズの評価
- プレスリリース・ニュースの要約

#### Webサイト変化
- 価格ページ・機能ページの変更点
- メッセージング・ポジショニングの変化
- 前後の比較を含める

#### 営業チーム向けアクション
- 上記の全変化に基づく具体的なアクションアイテム
- オブジェクションハンドリングのポイント
- 進行中の案件に使えるトークポイント

## Rules
- 各項目は「事実 → So What（だから何）→ 営業アクション」の3段構成にする
- 変化がないセクションは完全に省略する
- 最も重要度が高い変化を冒頭に配置する
- 具体的なデータを引用する。汎用的なアドバイスは書かない
- 全ての推奨事項は検出された具体的な変化に紐づけること`;
}
