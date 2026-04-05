import type { Insight } from "../shared/types.js";

export function buildPrompt(insights: Insight[]): string {
	const insightSummaries = insights
		.map(
			(insight) =>
				`- [${insight.type.toUpperCase()}] (score: ${insight.importanceScore}) ${insight.summary}`,
		)
		.join("\n");

	return `You are a competitive intelligence analyst for a cybersecurity company.

Based on the following competitive signals detected this week, generate a concise battle card digest in Markdown format.

## Signals

${insightSummaries}

## Instructions
- Group insights by competitor
- Highlight the most important changes first
- Include actionable recommendations for the sales and product teams
- Use clear, professional language
- Format as Markdown with headers, bullet points, and emphasis where appropriate`;
}
