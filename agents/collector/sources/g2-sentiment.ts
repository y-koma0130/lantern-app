import Anthropic from "@anthropic-ai/sdk";
import type { G2Data } from "./g2.js";

export interface KeywordEntry {
	word: string;
	count: number;
	sentiment: "positive" | "negative" | "neutral";
}

export interface G2SentimentData {
	competitorName: string;
	analyzedAt: string;
	/** Number of reviews fed into analysis */
	reviewCount: number;
	avgRating: number | null;
	ratingTrend: "improving" | "declining" | "stable" | "unknown";
	/** Top keywords extracted from review pros/cons */
	topKeywords: KeywordEntry[];
	/** Themes newly appearing compared to the norm */
	emergingThemes: string[];
	/** Themes that disappeared */
	fadingThemes: string[];
	/** Actionable signals for sales teams */
	salesSignals: string[];
}

const SENTIMENT_ANALYSIS_PROMPT = `You are a competitive intelligence analyst specialising in B2B SaaS.

Analyse the following G2 reviews for a cybersecurity product and extract structured insights.

## Reviews
{reviews}

## Overall stats
- Overall rating: {overallRating}
- Total review count: {totalReviews}
- Category: {category}
- Category rank: {categoryRank}

## Previous analysis (if available)
{previousAnalysis}

## Instructions

Return a JSON object (no markdown fences) with exactly these fields:

{
  "ratingTrend": "improving" | "declining" | "stable",
  "topKeywords": [
    {"word": "<keyword or short phrase>", "count": <number of reviews mentioning it>, "sentiment": "positive" | "negative" | "neutral"}
  ],
  "emergingThemes": ["<theme that is new or significantly increasing>"],
  "fadingThemes": ["<theme that has disappeared or significantly decreased>"],
  "salesSignals": ["<actionable insight for the sales team>"]
}

Rules:
- topKeywords: extract 5-10 keywords/phrases, sorted by frequency. If the same concept appears in pros AND cons, list separately with correct sentiment.
- emergingThemes / fadingThemes: compare against previous analysis if provided. If no previous analysis, emergingThemes = all notable themes, fadingThemes = [].
- salesSignals: 1-3 concise, actionable sentences. Format: "competitor weakness/strength → what our sales team should do".
- Return ONLY valid JSON. No explanation, no markdown.`;

function formatReviews(reviews: G2Data["recentReviews"]): string {
	if (reviews.length === 0) return "(No reviews available)";

	return reviews
		.map((r, i) => {
			const parts = [`Review ${i + 1}:`];
			if (r.reviewerTitle) parts.push(`  Role: ${r.reviewerTitle}`);
			if (r.rating != null) parts.push(`  Rating: ${r.rating}/5`);
			if (r.date) parts.push(`  Date: ${r.date}`);
			if (r.pros) parts.push(`  Pros: ${r.pros}`);
			if (r.cons) parts.push(`  Cons: ${r.cons}`);
			return parts.join("\n");
		})
		.join("\n\n");
}

function buildPrompt(g2Data: G2Data, previous: G2SentimentData | null): string {
	const reviewsStr = formatReviews(g2Data.recentReviews);

	const previousStr = previous
		? JSON.stringify(
				{
					topKeywords: previous.topKeywords,
					emergingThemes: previous.emergingThemes,
					salesSignals: previous.salesSignals,
				},
				null,
				2,
			)
		: "(No previous analysis — this is the first run)";

	return SENTIMENT_ANALYSIS_PROMPT.replace("{reviews}", reviewsStr)
		.replace("{overallRating}", String(g2Data.overallRating ?? "N/A"))
		.replace("{totalReviews}", String(g2Data.totalReviews ?? "N/A"))
		.replace("{category}", g2Data.category ?? "N/A")
		.replace("{categoryRank}", g2Data.categoryRank != null ? `#${g2Data.categoryRank}` : "N/A")
		.replace("{previousAnalysis}", previousStr);
}

function parseResponse(
	text: string,
): Omit<G2SentimentData, "competitorName" | "analyzedAt" | "reviewCount" | "avgRating"> {
	const cleaned = text
		.replace(/```json\s*/g, "")
		.replace(/```\s*/g, "")
		.trim();
	const parsed = JSON.parse(cleaned) as {
		ratingTrend?: string;
		topKeywords?: unknown[];
		emergingThemes?: string[];
		fadingThemes?: string[];
		salesSignals?: string[];
	};

	return {
		ratingTrend: (["improving", "declining", "stable"] as const).includes(
			parsed.ratingTrend as "improving" | "declining" | "stable",
		)
			? (parsed.ratingTrend as "improving" | "declining" | "stable")
			: "unknown",
		topKeywords: Array.isArray(parsed.topKeywords)
			? (parsed.topKeywords as KeywordEntry[]).slice(0, 10)
			: [],
		emergingThemes: Array.isArray(parsed.emergingThemes) ? parsed.emergingThemes : [],
		fadingThemes: Array.isArray(parsed.fadingThemes) ? parsed.fadingThemes : [],
		salesSignals: Array.isArray(parsed.salesSignals) ? parsed.salesSignals : [],
	};
}

export async function analyzeG2Sentiment(
	competitorName: string,
	g2Data: G2Data,
	previousSentiment: G2SentimentData | null,
): Promise<G2SentimentData> {
	if (g2Data.recentReviews.length === 0 && g2Data.overallRating == null) {
		console.warn(`[G2Sentiment] No review data for ${competitorName}, returning empty analysis`);
		return {
			competitorName,
			analyzedAt: new Date().toISOString(),
			reviewCount: 0,
			avgRating: null,
			ratingTrend: "unknown",
			topKeywords: [],
			emergingThemes: [],
			fadingThemes: [],
			salesSignals: [],
		};
	}

	console.log(
		`[G2Sentiment] Analysing ${g2Data.recentReviews.length} reviews for ${competitorName}`,
	);

	const client = new Anthropic();
	const prompt = buildPrompt(g2Data, previousSentiment);

	const response = await client.messages.create({
		model: "claude-haiku-4-5-20251001",
		max_tokens: 1024,
		messages: [{ role: "user", content: prompt }],
	});

	const contentBlock = response.content[0];
	if (!contentBlock || contentBlock.type !== "text") {
		throw new Error(`Empty response from Claude for ${competitorName}`);
	}

	const analysis = parseResponse(contentBlock.text);

	return {
		competitorName,
		analyzedAt: new Date().toISOString(),
		reviewCount: g2Data.recentReviews.length,
		avgRating: g2Data.overallRating,
		...analysis,
	};
}
