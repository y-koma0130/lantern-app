import { fetchCompetitors } from "../collector/repository.js";
import type { Organization } from "../shared/types.js";
import { detectDiffs } from "./differ.js";
import { fetchRecentSnapshots, saveInsights } from "./repository.js";
import { scoreSignal } from "./scorer.js";

export async function runAnalyst(org: Organization): Promise<void> {
	console.log("[Analyst] Starting...");

	const [snapshots, competitors] = await Promise.all([
		fetchRecentSnapshots(org.id),
		fetchCompetitors(org.id),
	]);

	const competitorNames = new Map(competitors.map((c) => [c.id, c.name]));
	const allInsights: Parameters<typeof saveInsights>[0] = [];

	for (const snapshot of snapshots) {
		try {
			const competitorName = competitorNames.get(snapshot.competitorId) ?? "Unknown";
			const diffs = await detectDiffs(snapshot, competitorName);

			for (const diff of diffs) {
				const score = scoreSignal(diff);

				allInsights.push({
					orgId: org.id,
					competitorId: snapshot.competitorId,
					snapshotId: snapshot.id,
					type: diff.type,
					importanceScore: score,
					summary: diff.summary,
					diffDetail: diff.detail,
				});
			}
		} catch (error) {
			console.error(`[Analyst] Failed for snapshot ${snapshot.id}:`, error);
		}
	}

	await saveInsights(allInsights);
	console.log(`[Analyst] Done. Saved ${allInsights.length} insights.`);
}
