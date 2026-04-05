import type { Competitor } from "../../shared/types.js";

export async function collectG2Reviews(competitor: Competitor): Promise<Record<string, unknown>> {
	// TODO: implement — scrape G2 reviews and ratings
	console.log(`[Collector] Fetching G2 reviews for ${competitor.name}: ${competitor.g2Url}`);

	return {
		g2Url: competitor.g2Url,
		scrapedAt: new Date().toISOString(),
		reviews: [],
		rating: null,
	};
}
