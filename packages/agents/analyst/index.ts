import { detectDiffs } from "./differ.js";
import { fetchRecentSnapshots, saveInsights } from "./repository.js";
import { scoreSignal } from "./scorer.js";

export async function runAnalyst(): Promise<void> {
	console.log("[Analyst] Starting...");

	const snapshots = await fetchRecentSnapshots();
	const allInsights: Parameters<typeof saveInsights>[0] = [];

	for (const snapshot of snapshots) {
		try {
			const diffs = await detectDiffs(snapshot);

			for (const diff of diffs) {
				const score = scoreSignal(diff);

				allInsights.push({
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
