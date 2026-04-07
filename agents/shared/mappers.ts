import type { Competitor, CompetitorSnapshot, Insight } from "./types.js";

export function mapSnapshotRow(row: Record<string, unknown>): CompetitorSnapshot {
	return {
		id: row.id as string,
		competitorId: row.competitor_id as string,
		source: row.source as CompetitorSnapshot["source"],
		rawData: row.raw_data as Record<string, unknown>,
		collectedAt: row.collected_at as string,
		orgId: row.org_id as string,
	};
}

export function mapCompetitorRow(row: Record<string, unknown>): Competitor {
	return {
		id: row.id as string,
		name: row.name as string,
		website: row.website as string,
		g2Url: (row.g2_url as string) ?? null,
		githubOrg: (row.github_org as string) ?? null,
		linkedinSlug: (row.linkedin_slug as string) ?? null,
		crunchbaseSlug: (row.crunchbase_slug as string) ?? null,
		niche: row.niche as string,
		createdAt: row.created_at as string,
		orgId: row.org_id as string,
	};
}

export function mapInsightRow(row: Record<string, unknown>): Insight {
	return {
		id: row.id as string,
		competitorId: row.competitor_id as string,
		snapshotId: row.snapshot_id as string,
		type: row.type as Insight["type"],
		importanceScore: row.importance_score as number,
		summary: row.summary as string,
		diffDetail: row.diff_detail as Record<string, unknown>,
		weekOf: row.week_of as string,
		createdAt: row.created_at as string,
		orgId: row.org_id as string,
	};
}
