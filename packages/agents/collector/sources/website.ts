import type { Competitor } from "../../shared/types.js";

export async function collectWebsiteData(competitor: Competitor): Promise<Record<string, unknown>> {
	// TODO: implement — crawl competitor website, extract pricing/features/messaging
	console.log(`[Collector] Crawling website for ${competitor.name}: ${competitor.website}`);

	return {
		url: competitor.website,
		scrapedAt: new Date().toISOString(),
		content: {},
	};
}
