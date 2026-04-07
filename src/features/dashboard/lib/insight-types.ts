export type InsightType = "pricing" | "feature" | "hiring" | "funding" | "sentiment" | "messaging";

interface InsightTypeConfig {
	label: string;
	/** SVG path(s) for a 16x16 viewBox icon */
	iconPath: string;
	bg: string;
	text: string;
}

/**
 * Centralized insight type configuration.
 * Colors follow Atlassian Design System tokens defined in globals.css.
 */
export const INSIGHT_TYPES: Record<InsightType, InsightTypeConfig> = {
	pricing: {
		label: "Pricing",
		iconPath:
			"M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM8.75 5a.75.75 0 0 0-1.5 0v.5H7a1.5 1.5 0 0 0 0 3h2a.5.5 0 0 1 0 1H6.25a.75.75 0 0 0 0 1.5H7.25V11.5a.75.75 0 0 0 1.5 0V11H9a1.5 1.5 0 0 0 0-3H7a.5.5 0 0 1 0-1h2.75a.75.75 0 0 0 0-1.5H8.75Z",
		bg: "#FFEBE6",
		text: "#BF2600",
	},
	funding: {
		label: "Funding",
		iconPath:
			"M4 2.5a.75.75 0 0 0-1.5 0v11a.75.75 0 0 0 1.5 0V10h4.75a.75.75 0 0 0 .67-1.085L7.77 6l1.65-2.915A.75.75 0 0 0 8.75 2H4v.5Z",
		bg: "#FFFAE6",
		text: "#946300",
	},
	sentiment: {
		label: "Sentiment",
		iconPath:
			"M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM5.5 6.5a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm3 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0ZM5.2 10a.75.75 0 0 1 1.05-.15A3.28 3.28 0 0 0 8 10.5c.65 0 1.25-.23 1.75-.65a.75.75 0 0 1 .9 1.2A4.78 4.78 0 0 1 8 12a4.78 4.78 0 0 1-2.65-1.05.75.75 0 0 1-.15-1Z",
		bg: "#E6FCFF",
		text: "#006A80",
	},
	feature: {
		label: "Feature",
		iconPath:
			"M8 1.5a.75.75 0 0 1 .75.75V3h4.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-.75.75H8.75v1.5h2.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-.75.75h-6.5a.75.75 0 0 1-.75-.75v-3.5a.75.75 0 0 1 .75-.75h2.5V8h-4.5A.75.75 0 0 1 2 7.25v-3.5A.75.75 0 0 1 2.75 3h4.5V2.25A.75.75 0 0 1 8 1.5Z",
		bg: "#E3FCEF",
		text: "#006644",
	},
	hiring: {
		label: "Hiring",
		iconPath:
			"M8 1.5A3.25 3.25 0 0 0 4.75 4.75 3.25 3.25 0 0 0 8 8a3.25 3.25 0 0 0 3.25-3.25A3.25 3.25 0 0 0 8 1.5ZM3 12.5a4.5 4.5 0 0 1 4.5-4h1a4.5 4.5 0 0 1 4.5 4.5.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5Z",
		bg: "#EAE6FF",
		text: "#403294",
	},
	messaging: {
		label: "Messaging",
		iconPath:
			"M1.5 3.75A.75.75 0 0 1 2.25 3h11.5a.75.75 0 0 1 0 1.5H2.25a.75.75 0 0 1-.75-.75ZM1.5 8a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 0 1.5H2.25A.75.75 0 0 1 1.5 8Zm.75 3.5a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5Z",
		bg: "#EBECF0",
		text: "#344563",
	},
};

const DEFAULT_CONFIG: InsightTypeConfig = INSIGHT_TYPES.messaging;

export function getInsightConfig(type: string): InsightTypeConfig {
	return INSIGHT_TYPES[type as InsightType] ?? DEFAULT_CONFIG;
}

/** Section grouping order for the dashboard — highest impact first */
export const SECTION_ORDER: { key: InsightType; title: string }[] = [
	{ key: "sentiment", title: "G2 Sentiment" },
	{ key: "funding", title: "Funding & M&A" },
	{ key: "pricing", title: "Pricing Changes" },
	{ key: "feature", title: "Feature Updates" },
	{ key: "hiring", title: "Hiring Signals" },
	{ key: "messaging", title: "Messaging & Mentions" },
];
