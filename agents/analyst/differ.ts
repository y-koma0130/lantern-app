import { getLatestSnapshot } from "../collector/repository.js";
import type { G2Data } from "../collector/sources/g2.js";
import type { WebsiteCollectionResult } from "../collector/sources/website.js";
import type { CompetitorSnapshot, Insight } from "../shared/types.js";

export interface DetectedDiff {
	type: Insight["type"];
	summary: string;
	detail: Record<string, unknown>;
}

const MAX_DETAIL_TEXT_LENGTH = 500;

function truncate(text: string): string {
	if (text.length <= MAX_DETAIL_TEXT_LENGTH) return text;
	return `${text.slice(0, MAX_DETAIL_TEXT_LENGTH)}...`;
}

function detectWebsiteDiffs(
	current: WebsiteCollectionResult,
	previous: WebsiteCollectionResult,
): DetectedDiff[] {
	const diffs: DetectedDiff[] = [];
	const currentPages = current.pages;
	const previousPages = previous.pages;
	const allPaths = new Set([...Object.keys(currentPages), ...Object.keys(previousPages)]);

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

		const lowerPath = path.toLowerCase();

		if (
			(lowerPath.includes("pricing") || lowerPath.includes("plans")) &&
			curPage.bodyText !== prevPage.bodyText
		) {
			diffs.push({
				type: "pricing",
				summary: `Pricing page content changed on "${path}"`,
				detail: {
					path,
					field: "bodyText",
					previous: truncate(prevPage.bodyText),
					current: truncate(curPage.bodyText),
				},
			});
		}

		if (
			(lowerPath.includes("feature") ||
				lowerPath.includes("product") ||
				lowerPath.includes("solutions")) &&
			curPage.bodyText !== prevPage.bodyText
		) {
			diffs.push({
				type: "feature",
				summary: `Features page content changed on "${path}"`,
				detail: {
					path,
					field: "bodyText",
					previous: truncate(prevPage.bodyText),
					current: truncate(curPage.bodyText),
				},
			});
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

export async function detectDiffs(snapshot: CompetitorSnapshot): Promise<DetectedDiff[]> {
	const previous = await getLatestSnapshot(snapshot.competitorId, snapshot.source);
	if (!previous) return [];

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
		default:
			return [];
	}
}
