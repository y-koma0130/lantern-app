import { supabase } from "../shared/db.js";
import type { Competitor, CompetitorSnapshot } from "../shared/types.js";

export async function fetchCompetitors(orgId: string): Promise<Competitor[]> {
	const { data, error } = await supabase.from("competitors").select("*").eq("org_id", orgId);

	if (error) {
		throw new Error(`Failed to fetch competitors: ${error.message}`);
	}

	return (data ?? []) as Competitor[];
}

export async function saveSnapshots(
	snapshots: {
		orgId: string;
		competitorId: string;
		source: CompetitorSnapshot["source"];
		rawData: Record<string, unknown>;
	}[],
): Promise<void> {
	if (snapshots.length === 0) return;

	const rows = snapshots.map((s) => ({
		org_id: s.orgId,
		competitor_id: s.competitorId,
		source: s.source,
		raw_data: s.rawData,
		collected_at: new Date().toISOString(),
	}));

	const { error } = await supabase.from("competitor_snapshots").insert(rows);

	if (error) {
		throw new Error(`Failed to save snapshots: ${error.message}`);
	}
}

export async function getLatestSnapshot(
	competitorId: string,
	source: CompetitorSnapshot["source"],
): Promise<CompetitorSnapshot | null> {
	const { data, error } = await supabase
		.from("competitor_snapshots")
		.select("*")
		.eq("competitor_id", competitorId)
		.eq("source", source)
		.order("collected_at", { ascending: false })
		.limit(1)
		.single();

	if (error) {
		return null;
	}

	return data as CompetitorSnapshot;
}
