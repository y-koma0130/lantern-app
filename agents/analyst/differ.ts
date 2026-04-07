import { getLatestSnapshot } from "../collector/repository.js";
import type { CrunchbaseData } from "../collector/sources/crunchbase.js";
import type { G2SentimentData } from "../collector/sources/g2-sentiment.js";
import type { G2Data } from "../collector/sources/g2.js";
import type { HnData } from "../collector/sources/hn.js";
import type { WebsiteCollectionResult } from "../collector/sources/website.js";
import type { CompetitorSnapshot, Insight } from "../shared/types.js";
import { summarizeWebsiteDiff } from "./summarizer.js";

export interface DetectedDiff {
	type: Insight["type"];
	summary: string;
	detail: Record<string, unknown>;
}

const MAX_DETAIL_TEXT_LENGTH = 1_000;

function truncate(text: string): string {
	if (text.length <= MAX_DETAIL_TEXT_LENGTH) return text;
	return `${text.slice(0, MAX_DETAIL_TEXT_LENGTH)}...`;
}

function classifyPageType(path: string): DetectedDiff["type"] {
	const lower = path.toLowerCase();
	if (lower.includes("pricing") || lower.includes("plans")) return "pricing";
	if (lower.includes("feature") || lower.includes("product") || lower.includes("solutions"))
		return "feature";
	return "messaging";
}

async function detectWebsiteDiffs(
	current: WebsiteCollectionResult,
	previous: WebsiteCollectionResult,
): Promise<DetectedDiff[]> {
	const diffs: DetectedDiff[] = [];
	const currentPages = current.pages;
	const previousPages = previous.pages;
	const allPaths = new Set([...Object.keys(currentPages), ...Object.keys(previousPages)]);

	// Collect LLM summarization tasks for bodyText changes
	const summarizeTasks: Promise<void>[] = [];

	for (const path of allPaths) {
		const curPage = currentPages[path];
		const prevPage = previousPages[path];
		if (!curPage || !prevPage) continue;

		if (curPage.title && prevPage.title && curPage.title !== prevPage.title) {
			diffs.push({
				type: "messaging",
				summary: `Page title changed on "${path}": "${prevPage.title}" → "${curPage.title}"`,
				detail: { path, field: "title", previous: prevPage.title, current: curPage.title },
			});
		}

		// Body text changed → summarize with LLM
		if (curPage.bodyText !== prevPage.bodyText) {
			const type = classifyPageType(path);
			const title = curPage.title || path;

			summarizeTasks.push(
				summarizeWebsiteDiff(path, title, prevPage.bodyText, curPage.bodyText).then((result) => {
					diffs.push({
						type,
						summary: result.headline,
						detail: {
							path,
							field: "bodyText",
							changes: result.changes,
							salesImplication: result.salesImplication,
							previous: truncate(prevPage.bodyText),
							current: truncate(curPage.bodyText),
						},
					});
				}),
			);
		}

		const prevSet = new Set(prevPage.headings);
		const curSet = new Set(curPage.headings);
		const added = curPage.headings.filter((h) => !prevSet.has(h));
		const removed = prevPage.headings.filter((h) => !curSet.has(h));

		if (added.length > 0 || removed.length > 0) {
			diffs.push({
				type: "messaging",
				summary: `Headings changed on "${path}": ${added.length} added, ${removed.length} removed`,
				detail: { path, field: "headings", added, removed },
			});
		}
	}

	// Run all LLM summarizations in parallel
	await Promise.all(summarizeTasks);

	return diffs;
}

function detectG2Diffs(current: G2Data, previous: G2Data): DetectedDiff[] {
	const diffs: DetectedDiff[] = [];

	if (
		current.overallRating != null &&
		previous.overallRating != null &&
		current.overallRating !== previous.overallRating
	) {
		diffs.push({
			type: "sentiment",
			summary: `G2 rating changed from ${previous.overallRating} to ${current.overallRating}`,
			detail: {
				field: "overallRating",
				previous: previous.overallRating,
				current: current.overallRating,
			},
		});
	}

	if (
		current.totalReviews != null &&
		previous.totalReviews != null &&
		current.totalReviews !== previous.totalReviews
	) {
		const delta = current.totalReviews - previous.totalReviews;
		diffs.push({
			type: "sentiment",
			summary: `G2 review count changed from ${previous.totalReviews} to ${current.totalReviews} (${delta > 0 ? "+" : ""}${delta})`,
			detail: {
				field: "totalReviews",
				previous: previous.totalReviews,
				current: current.totalReviews,
				delta,
			},
		});
	}

	if (
		current.categoryRank != null &&
		previous.categoryRank != null &&
		current.categoryRank !== previous.categoryRank
	) {
		const improved = current.categoryRank < previous.categoryRank;
		diffs.push({
			type: "sentiment",
			summary: `G2 category rank ${improved ? "improved" : "dropped"} from #${previous.categoryRank} to #${current.categoryRank}`,
			detail: {
				field: "categoryRank",
				previous: previous.categoryRank,
				current: current.categoryRank,
			},
		});
	}

	return diffs;
}

function detectG2SentimentDiffs(
	current: G2SentimentData,
	previous: G2SentimentData,
): DetectedDiff[] {
	const diffs: DetectedDiff[] = [];

	// Rating trend change
	if (
		current.ratingTrend !== "unknown" &&
		previous.ratingTrend !== "unknown" &&
		current.ratingTrend !== previous.ratingTrend
	) {
		diffs.push({
			type: "sentiment",
			summary: `G2 rating trend shifted from "${previous.ratingTrend}" to "${current.ratingTrend}" for ${current.competitorName}`,
			detail: {
				field: "ratingTrend",
				previous: previous.ratingTrend,
				current: current.ratingTrend,
				avgRating: current.avgRating,
			},
		});
	}

	// Emerging themes
	for (const theme of current.emergingThemes) {
		diffs.push({
			type: "sentiment",
			summary: `G2 emerging theme for ${current.competitorName}: "${theme}"`,
			detail: {
				field: "emergingTheme",
				theme,
				competitorName: current.competitorName,
			},
		});
	}

	// Fading themes — signal that a previously notable concern has disappeared
	for (const theme of current.fadingThemes) {
		diffs.push({
			type: "sentiment",
			summary: `G2 fading theme for ${current.competitorName}: "${theme}" is no longer mentioned`,
			detail: {
				field: "fadingTheme",
				theme,
				competitorName: current.competitorName,
			},
		});
	}

	// Negative keyword spike detection
	const prevNegativeMap = new Map<string, number>();
	for (const kw of previous.topKeywords) {
		if (kw.sentiment === "negative") prevNegativeMap.set(kw.word, kw.count);
	}
	for (const kw of current.topKeywords) {
		if (kw.sentiment !== "negative") continue;
		const prevCount = prevNegativeMap.get(kw.word) ?? 0;
		if (kw.count >= prevCount + 2) {
			diffs.push({
				type: "sentiment",
				summary: `Negative keyword spike for ${current.competitorName}: "${kw.word}" (${prevCount} → ${kw.count} mentions)`,
				detail: {
					field: "negativeKeywordSpike",
					keyword: kw.word,
					previousCount: prevCount,
					currentCount: kw.count,
					competitorName: current.competitorName,
				},
			});
		}
	}

	// Sales signals (always generate if present — they are the core value)
	if (current.salesSignals.length > 0) {
		diffs.push({
			type: "sentiment",
			summary: `G2 sales signals for ${current.competitorName}: ${current.salesSignals.join(" / ")}`,
			detail: {
				field: "salesSignals",
				signals: current.salesSignals,
				topKeywords: current.topKeywords,
				competitorName: current.competitorName,
			},
		});
	}

	return diffs;
}

function detectHnDiffs(current: HnData, previous: HnData): DetectedDiff[] {
	const diffs: DetectedDiff[] = [];
	const previousIds = new Set(previous.stories.map((s) => s.objectID));
	const newStories = current.stories.filter((s) => !previousIds.has(s.objectID));

	if (newStories.length === 0) return diffs;

	// High-engagement stories (>= 10 points) get individual insights
	const highEngagement = newStories.filter((s) => s.points >= 10);
	const lowEngagement = newStories.filter((s) => s.points < 10);

	for (const story of highEngagement) {
		diffs.push({
			type: "messaging",
			summary: `HackerNews: "${story.title}" (${story.points} points, ${story.numComments} comments)`,
			detail: {
				field: "hnHighEngagement",
				storyId: story.objectID,
				title: story.title,
				url: story.url,
				points: story.points,
				numComments: story.numComments,
				createdAt: story.createdAt,
				competitorName: current.competitorName,
			},
		});
	}

	// Low-engagement stories grouped into a single summary
	if (lowEngagement.length > 0) {
		diffs.push({
			type: "messaging",
			summary: `HackerNews: ${lowEngagement.length} new mention(s) for ${current.competitorName}`,
			detail: {
				field: "hnMentions",
				stories: lowEngagement.map((s) => ({
					title: s.title,
					url: s.url,
					points: s.points,
					numComments: s.numComments,
				})),
				competitorName: current.competitorName,
			},
		});
	}

	return diffs;
}

function detectCrunchbaseDiffs(current: CrunchbaseData, previous: CrunchbaseData): DetectedDiff[] {
	const diffs: DetectedDiff[] = [];

	// New funding round detected
	const prevRoundKeys = new Set(previous.fundingRounds.map((r) => `${r.roundName}-${r.date}`));
	const newRounds = current.fundingRounds.filter(
		(r) => !prevRoundKeys.has(`${r.roundName}-${r.date}`),
	);

	for (const round of newRounds) {
		diffs.push({
			type: "funding",
			summary: `${current.competitorName} raised ${round.amount ?? "undisclosed amount"} in ${round.roundName}`,
			detail: {
				field: "fundingRound",
				roundName: round.roundName,
				amount: round.amount,
				date: round.date,
				leadInvestors: round.leadInvestors,
				competitorName: current.competitorName,
			},
		});
	}

	// Total funding changed — skip if a new round already explains the change
	if (
		newRounds.length === 0 &&
		current.totalFunding &&
		previous.totalFunding &&
		current.totalFunding !== previous.totalFunding
	) {
		diffs.push({
			type: "funding",
			summary: `${current.competitorName} total funding changed: ${previous.totalFunding} → ${current.totalFunding}`,
			detail: {
				field: "totalFunding",
				previous: previous.totalFunding,
				current: current.totalFunding,
				competitorName: current.competitorName,
			},
		});
	}

	// Employee range changed
	if (
		current.employeeRange &&
		previous.employeeRange &&
		current.employeeRange !== previous.employeeRange
	) {
		diffs.push({
			type: "hiring",
			summary: `${current.competitorName} employee range changed: ${previous.employeeRange} → ${current.employeeRange}`,
			detail: {
				field: "employeeRange",
				previous: previous.employeeRange,
				current: current.employeeRange,
				competitorName: current.competitorName,
			},
		});
	}

	// New press/news
	const prevNewsTitles = new Set(previous.recentNews.map((n) => n.title));
	const newNews = current.recentNews.filter((n) => !prevNewsTitles.has(n.title));
	if (newNews.length > 0) {
		diffs.push({
			type: "messaging",
			summary: `${current.competitorName}: ${newNews.length} new press mention(s)`,
			detail: {
				field: "crunchbaseNews",
				news: newNews,
				competitorName: current.competitorName,
			},
		});
	}

	return diffs;
}

export async function detectDiffs(snapshot: CompetitorSnapshot): Promise<DetectedDiff[]> {
	const previous = await getLatestSnapshot(snapshot.competitorId, snapshot.source);

	if (!previous) {
		return generateInitialInsights(snapshot);
	}

	switch (snapshot.source) {
		case "website":
			return detectWebsiteDiffs(
				snapshot.rawData as unknown as WebsiteCollectionResult,
				previous.rawData as unknown as WebsiteCollectionResult,
			);
		case "g2":
			return detectG2Diffs(
				snapshot.rawData as unknown as G2Data,
				previous.rawData as unknown as G2Data,
			);
		case "g2_sentiment":
			return detectG2SentimentDiffs(
				snapshot.rawData as unknown as G2SentimentData,
				previous.rawData as unknown as G2SentimentData,
			);
		case "hn":
			return detectHnDiffs(
				snapshot.rawData as unknown as HnData,
				previous.rawData as unknown as HnData,
			);
		case "crunchbase":
			return detectCrunchbaseDiffs(
				snapshot.rawData as unknown as CrunchbaseData,
				previous.rawData as unknown as CrunchbaseData,
			);
		default:
			return [];
	}
}

function generateInitialInsights(snapshot: CompetitorSnapshot): DetectedDiff[] {
	const diffs: DetectedDiff[] = [];

	if (snapshot.source === "website") {
		const data = snapshot.rawData as unknown as WebsiteCollectionResult;
		const pages = data.pages ?? {};

		for (const [path, page] of Object.entries(pages)) {
			if (!page?.title) continue;

			const lowerPath = path.toLowerCase();
			let type: DetectedDiff["type"] = "messaging";

			if (lowerPath.includes("pricing") || lowerPath.includes("plans")) {
				type = "pricing";
			} else if (
				lowerPath.includes("feature") ||
				lowerPath.includes("product") ||
				lowerPath.includes("solutions")
			) {
				type = "feature";
			}

			const headings = page.headings ?? [];
			const bodyPreview = truncate(page.bodyText ?? "");

			diffs.push({
				type,
				summary: `[Baseline] ${page.title} — ${headings.length} sections, ${(page.bodyText ?? "").length} chars of content`,
				detail: {
					path,
					title: page.title,
					headings,
					bodyPreview,
					metaDescription: page.metaDescription ?? "",
				},
			});
		}
	}

	if (snapshot.source === "g2") {
		const data = snapshot.rawData as unknown as G2Data;

		if (data.overallRating != null) {
			diffs.push({
				type: "sentiment",
				summary: `[Baseline] G2 rating: ${data.overallRating}/5 with ${data.totalReviews ?? 0} reviews${data.category ? ` in ${data.category}` : ""}${data.categoryRank ? ` (ranked #${data.categoryRank})` : ""}`,
				detail: {
					overallRating: data.overallRating,
					totalReviews: data.totalReviews,
					category: data.category,
					categoryRank: data.categoryRank,
				},
			});
		}
	}

	if (snapshot.source === "g2_sentiment") {
		const data = snapshot.rawData as unknown as G2SentimentData;

		if (data.topKeywords.length > 0 || data.salesSignals.length > 0) {
			diffs.push({
				type: "sentiment",
				summary: `[Baseline] G2 sentiment for ${data.competitorName}: ${data.topKeywords.length} keywords analysed, rating trend: ${data.ratingTrend}`,
				detail: {
					competitorName: data.competitorName,
					ratingTrend: data.ratingTrend,
					topKeywords: data.topKeywords,
					emergingThemes: data.emergingThemes,
					salesSignals: data.salesSignals,
				},
			});
		}
	}

	if (snapshot.source === "hn") {
		const data = snapshot.rawData as unknown as HnData;

		if (data.stories.length > 0) {
			const topStory = data.stories.reduce((a, b) => (a.points > b.points ? a : b));
			diffs.push({
				type: "messaging",
				summary: `[Baseline] ${data.stories.length} HackerNews mention(s) for ${data.competitorName}. Top: "${topStory.title}" (${topStory.points} points)`,
				detail: {
					competitorName: data.competitorName,
					storyCount: data.stories.length,
					topStory: {
						title: topStory.title,
						url: topStory.url,
						points: topStory.points,
						numComments: topStory.numComments,
					},
				},
			});
		}
	}

	if (snapshot.source === "crunchbase") {
		const data = snapshot.rawData as unknown as CrunchbaseData;

		const parts: string[] = [];
		if (data.totalFunding) parts.push(`Total funding: ${data.totalFunding}`);
		if (data.lastFundingRound) parts.push(`Last round: ${data.lastFundingRound}`);
		if (data.employeeRange) parts.push(`Employees: ${data.employeeRange}`);

		if (parts.length > 0) {
			diffs.push({
				type: "funding",
				summary: `[Baseline] ${data.competitorName} — ${parts.join(", ")}`,
				detail: {
					competitorName: data.competitorName,
					totalFunding: data.totalFunding,
					lastFundingRound: data.lastFundingRound,
					lastFundingDate: data.lastFundingDate,
					employeeRange: data.employeeRange,
					fundingRounds: data.fundingRounds,
				},
			});
		}
	}

	return diffs;
}
