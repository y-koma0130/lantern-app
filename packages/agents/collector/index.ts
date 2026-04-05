import type { CompetitorSnapshot } from "../shared/types.js";
import { fetchCompetitors, saveSnapshots } from "./repository.js";
import { collectG2Reviews } from "./sources/g2.js";
import { collectWebsiteData } from "./sources/website.js";

export async function runCollector(): Promise<void> {
	console.log("[Collector] Starting...");

	const competitors = await fetchCompetitors();
	const snapshots: {
		competitorId: string;
		source: CompetitorSnapshot["source"];
		rawData: Record<string, unknown>;
	}[] = [];

	for (const competitor of competitors) {
		try {
			const [websiteData, g2Data] = await Promise.all([
				collectWebsiteData(competitor),
				competitor.g2Url ? collectG2Reviews(competitor) : null,
			]);

			snapshots.push({
				competitorId: competitor.id,
				source: "website",
				rawData: websiteData,
			});

			if (g2Data) {
				snapshots.push({
					competitorId: competitor.id,
					source: "g2",
					rawData: g2Data,
				});
			}
		} catch (error) {
			console.error(`[Collector] Failed for competitor ${competitor.name}:`, error);
		}
	}

	await saveSnapshots(snapshots);
	console.log(`[Collector] Done. Saved ${snapshots.length} snapshots.`);
}
