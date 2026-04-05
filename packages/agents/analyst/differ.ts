import type { CompetitorSnapshot, Insight } from "../shared/types.js";

export interface DetectedDiff {
	type: Insight["type"];
	summary: string;
	detail: Record<string, unknown>;
}

export async function detectDiffs(snapshot: CompetitorSnapshot): Promise<DetectedDiff[]> {
	// TODO: implement — compare snapshot against previous snapshot to detect changes
	// Should compare rawData fields and identify meaningful differences
	console.log(`[Analyst] Detecting diffs for snapshot ${snapshot.id} (source: ${snapshot.source})`);

	return [];
}
