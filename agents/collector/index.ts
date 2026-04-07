import type { CompetitorSnapshot } from "../shared/types.js";
import type { Organization } from "../shared/types.js";
import { fetchCompetitors, getLatestSnapshot, saveSnapshots } from "./repository.js";
import { collectCrunchbaseData } from "./sources/crunchbase.js";
import type { G2SentimentData } from "./sources/g2-sentiment.js";
import { analyzeG2Sentiment } from "./sources/g2-sentiment.js";
import { collectG2Reviews } from "./sources/g2.js";
import { collectHnMentions } from "./sources/hn.js";
import { collectWebsiteData } from "./sources/website.js";

type SnapshotInput = {
	orgId: string;
	competitorId: string;
	source: CompetitorSnapshot["source"];
	rawData: Record<string, unknown>;
};

export async function runCollector(org: Organization): Promise<void> {
	console.log("[Collector] Starting...");

	const competitors = await fetchCompetitors(org.id);
	const allResults = await Promise.allSettled(
		competitors.map(async (competitor) => {
			const hasG2 = Boolean(competitor.g2Url);

			const [websiteData, g2Data, hnData, crunchbaseData, prevG2SentimentSnapshot] =
				await Promise.all([
					collectWebsiteData(competitor),
					hasG2 ? collectG2Reviews(competitor) : null,
					collectHnMentions(competitor),
					competitor.crunchbaseSlug ? collectCrunchbaseData(competitor) : null,
					hasG2 ? getLatestSnapshot(competitor.id, "g2_sentiment") : null,
				]);

			// Run sentiment analysis on G2 reviews
			let g2Sentiment: G2SentimentData | null = null;
			if (g2Data && g2Data.recentReviews.length > 0) {
				try {
					const prevSentiment = prevG2SentimentSnapshot
						? (prevG2SentimentSnapshot.rawData as unknown as G2SentimentData)
						: null;
					g2Sentiment = await analyzeG2Sentiment(competitor.name, g2Data, prevSentiment);
				} catch (error) {
					console.error(`[Collector] G2 sentiment analysis failed for ${competitor.name}:`, error);
				}
			}

			// Build snapshot entries — skip nulls and empty collections
			const entries: [CompetitorSnapshot["source"], unknown, boolean][] = [
				["website", websiteData, true],
				["g2", g2Data, g2Data != null],
				["g2_sentiment", g2Sentiment, g2Sentiment != null],
				["hn", hnData, hnData.stories.length > 0],
				["crunchbase", crunchbaseData, crunchbaseData != null],
			];

			return {
				competitorId: competitor.id,
				entries: entries
					.filter(([, , include]) => include)
					.map(([source, data]) => ({
						orgId: org.id,
						competitorId: competitor.id,
						source,
						rawData: data as Record<string, unknown>,
					})),
			};
		}),
	);

	const snapshots: SnapshotInput[] = [];
	for (const result of allResults) {
		if (result.status === "rejected") {
			console.error("[Collector] Failed for a competitor:", result.reason);
			continue;
		}
		snapshots.push(...result.value.entries);
	}

	await saveSnapshots(snapshots);
	console.log(`[Collector] Done. Saved ${snapshots.length} snapshots.`);
}
