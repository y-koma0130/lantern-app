import type { Insight } from "../shared/types.js";

export function buildPrompt(insights: Insight[]): string {
	const isBaseline = insights.some((i) => i.summary.startsWith("[Baseline]"));

	const insightBlocks = insights
		.map((insight) => {
			const detail = insight.diffDetail as Record<string, unknown>;
			let detailStr = "";

			if (detail.headings && Array.isArray(detail.headings)) {
				detailStr += `\n    Key sections: ${(detail.headings as string[]).slice(0, 10).join(" | ")}`;
			}
			if (detail.bodyPreview) {
				detailStr += `\n    Content preview: ${detail.bodyPreview}`;
			}
			if (detail.metaDescription) {
				detailStr += `\n    Meta: ${detail.metaDescription}`;
			}
			if (detail.added && Array.isArray(detail.added)) {
				detailStr += `\n    Added: ${(detail.added as string[]).join(", ")}`;
			}
			if (detail.removed && Array.isArray(detail.removed)) {
				detailStr += `\n    Removed: ${(detail.removed as string[]).join(", ")}`;
			}
			if (detail.previous !== undefined && detail.current !== undefined) {
				detailStr += `\n    Before: ${String(detail.previous).slice(0, 200)}`;
				detailStr += `\n    After: ${String(detail.current).slice(0, 200)}`;
			}

			return `- [${insight.type.toUpperCase()}] (score: ${insight.importanceScore}) ${insight.summary}${detailStr}`;
		})
		.join("\n\n");

	if (isBaseline) {
		return buildBaselinePrompt(insightBlocks);
	}

	return buildChangePrompt(insightBlocks);
}

function buildBaselinePrompt(insightBlocks: string): string {
	return `You are a senior competitive intelligence analyst specializing in cybersecurity SaaS.

This is the FIRST analysis of these competitors. Based on the initial data collected from their websites, create a comprehensive competitive landscape overview.

## Collected Data

${insightBlocks}

## Instructions

Create a battle card digest in Markdown with these sections:

### 1. Competitive Landscape Overview
- Summarize each competitor's positioning based on their page content
- Identify their primary value propositions and target audience
- Note their pricing approach (if pricing page data is available)

### 2. Competitor Profiles
For each competitor with data:
- **Positioning**: What they claim to do and who they target
- **Key Features**: Notable capabilities from their features page
- **Pricing Signal**: Any pricing indicators found
- **Messaging Style**: How they position vs competition

### 3. Strategic Observations
- Identify market trends across competitors
- Note gaps or opportunities in the market
- Highlight any surprising positioning or messaging

### 4. Recommendations
- What to watch for in future analyses
- Suggested areas for competitive differentiation
- Key questions the sales team should be prepared to answer

Be specific and reference actual content from the data. Avoid generic advice.
Use concrete details from the headings, page titles, and content previews provided.`;
}

function buildChangePrompt(insightBlocks: string): string {
	return `You are a senior competitive intelligence analyst specializing in cybersecurity SaaS.

Based on the following competitive changes detected this week, generate an actionable battle card digest.

## Changes Detected

${insightBlocks}

## Instructions

Create a battle card digest in Markdown with these sections:

### 1. Executive Summary
- 2-3 sentence overview of the most important changes
- Overall threat/opportunity assessment (High/Medium/Low)

### 2. Critical Changes (grouped by competitor)
For each competitor with changes:
- **What changed**: Specific description based on the data
- **Why it matters**: Strategic implication
- **Action required**: Concrete next step for the team

### 3. Pricing & Packaging Changes
- Detail any pricing page changes with before/after context
- Impact on our competitive positioning

### 4. Feature & Product Updates
- New features or capabilities detected
- How they compare to our offering

### 5. Messaging & Positioning Shifts
- Changes in how competitors describe themselves
- New/removed talking points

### 6. Sales Team Action Items
- Updated objection handling points
- Specific talking points for deals in progress
- Competitive traps to watch for

Be specific. Reference actual changes from the data.
Do NOT include generic advice. Every recommendation should tie to a specific change detected.`;
}
