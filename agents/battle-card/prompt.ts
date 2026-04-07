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
			const detail = (insight.diffDetail as Record<string, unknown>) ?? {};
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
You produce reports for sales and product teams.

This is the FIRST analysis of these competitors. Create a comprehensive competitive landscape overview based on the initial data.

## Collected Data

${insightBlocks}

## Instructions

Create a battle card digest in Markdown.

### 1. Competitive Landscape Overview
- Summarize each competitor's positioning based on their page content
- Identify their primary value propositions and target audience
- Note their pricing approach (if pricing page data is available)

### 2. Competitor Profiles
For each competitor with data:
- **Positioning**: What they claim to do and who they target
- **Key Features**: Notable capabilities from their features page
- **Pricing Signal**: Any pricing indicators found
- **G2 Sentiment**: What customers are saying in reviews (if data available)
- **Funding & Scale**: Funding status and employee range (if Crunchbase data available)
- **Market Buzz**: HackerNews mention trends (if data available)

### 3. Strategic Observations
- Identify market trends across competitors
- Note gaps or opportunities in the market
- Highlight any surprising positioning or messaging

### 4. Recommendations
- What to watch for in future analyses
- Suggested areas for competitive differentiation
- Key questions the sales team should be prepared to answer

Be specific and reference actual content from the data. Avoid generic advice.`;
}

function buildChangePrompt(insightBlocks: string): string {
	return `You are a senior competitive intelligence analyst specialising in cybersecurity SaaS.
You produce weekly digests for sales and product teams.

Based on the following competitive intelligence collected this week, generate an actionable digest.

## Collected Intelligence

${insightBlocks}

## Instructions

Create a weekly digest in Markdown.
Include ONLY sections that have relevant data — omit empty sections entirely.
Put the highest-impact section first.

### Available sections (include only when data exists):

#### G2 Sentiment Pulse
- New review count and rating trend changes
- Keyword frequency shifts (especially spikes in negative keywords)
- Specific implications for sales conversations
- Example format: "Competitor X's reviews saw a surge in mentions of 'slow support' — was zero last month → opportunity to highlight our response times"

#### Mentions & News
- HackerNews and Reddit mention summary
- Include engagement metrics (points, comment count)
- Market voice summary and implications

#### Funding & M&A
- Funding round details (amount, round name, lead investors)
- Employee count changes
- Assessment of competitor's financial strength and growth phase
- Press release and news summary

#### Website Changes
- Pricing and feature page changes
- Messaging and positioning shifts
- Include before/after comparison

#### Sales Team Actions
- Specific action items based on all changes above
- Objection handling points
- Talking points for deals in progress

## Rules
- Structure each item as: Fact → So What → Sales Action
- Completely omit sections with no changes
- Lead with the highest-impact change
- Reference specific data. No generic advice
- Every recommendation must tie to a specific detected change`;
}
