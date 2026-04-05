import { getCurrentWeek } from "../shared/date.js";
import { supabase } from "../shared/db.js";
import type { CompetitorSnapshot, Insight } from "../shared/types.js";

export async function fetchRecentSnapshots(): Promise<CompetitorSnapshot[]> {
	const { data, error } = await supabase
		.from("competitor_snapshots")
		.select("*")
		.order("collected_at", { ascending: false })
		.limit(100);

	if (error) {
		throw new Error(`Failed to fetch snapshots: ${error.message}`);
	}

	return (data ?? []) as CompetitorSnapshot[];
}

export async function saveInsights(
	inputs: {
		competitorId: string;
		snapshotId: string;
		type: Insight["type"];
		importanceScore: number;
		summary: string;
		diffDetail: Record<string, unknown>;
	}[],
): Promise<void> {
	if (inputs.length === 0) return;

	const weekOf = getCurrentWeek();
	const rows = inputs.map((input) => ({
		competitor_id: input.competitorId,
		snapshot_id: input.snapshotId,
		type: input.type,
		importance_score: input.importanceScore,
		summary: input.summary,
		diff_detail: input.diffDetail,
		week_of: weekOf,
	}));

	const { error } = await supabase.from("insights").insert(rows);

	if (error) {
		throw new Error(`Failed to save insights: ${error.message}`);
	}
}

export async function fetchInsightsByWeek(weekOf: string): Promise<Insight[]> {
	const { data, error } = await supabase
		.from("insights")
		.select("*")
		.eq("week_of", weekOf)
		.order("importance_score", { ascending: false });

	if (error) {
		throw new Error(`Failed to fetch insights: ${error.message}`);
	}

	return (data ?? []) as Insight[];
}
