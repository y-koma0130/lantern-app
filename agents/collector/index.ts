import type { Organization } from "../shared/types.js";
import { fetchCompetitors, saveSnapshots } from "./repository.js";
import { collectG2Reviews } from "./sources/g2.js";
import { collectWebsiteData } from "./sources/website.js";

export async function runCollector(org: Organization): Promise<void> {
	console.log("[Collector] Starting...");

	const competitors = await fetchCompetitors(org.id);
	const allResults = await Promise.allSettled(
		competitors.map(async (competitor) => {
			const [websiteData, g2Data] = await Promise.all([
				collectWebsiteData(competitor),
				competitor.g2Url ? collectG2Reviews(competitor) : null,
			]);
			return { competitor, websiteData, g2Data };
		}),
	);

	const snapshots: Parameters<typeof saveSnapshots>[0] = [];
	for (const result of allResults) {
		if (result.status === "rejected") {
			console.error("[Collector] Failed for a competitor:", result.reason);
			continue;
		}
		const { competitor, websiteData, g2Data } = result.value;
		snapshots.push({
			orgId: org.id,
			competitorId: competitor.id,
			source: "website",
			rawData: websiteData as unknown as Record<string, unknown>,
		});
		if (g2Data) {
			snapshots.push({
				orgId: org.id,
				competitorId: competitor.id,
				source: "g2",
				rawData: g2Data as unknown as Record<string, unknown>,
			});
		}
	}

	await saveSnapshots(snapshots);
	console.log(`[Collector] Done. Saved ${snapshots.length} snapshots.`);
}
