import { DigestListItem } from "@/features/dashboard/components/digest-list-item";
import { InsightCard } from "@/features/dashboard/components/insight-card";
import { getArchiveDays } from "@/lib/plan-limits";
import { createAdminClient } from "@/lib/supabase/admin";
import { type InsightType, SECTION_ORDER, getInsightConfig } from "../lib/insight-types";

interface DashboardPageProps {
	orgId: string;
	orgSlug: string;
	orgPlan: string;
}

function getArchiveCutoff(plan: string): string | null {
	const days = getArchiveDays(plan);
	if (days === null) return null; // unlimited
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - days);
	return cutoff.toISOString();
}

function formatWeekDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

interface InsightRow {
	id: string;
	type: string;
	importance_score: number;
	summary: string;
	diff_detail: Record<string, unknown>;
	week_of: string;
	competitors: unknown;
}

export async function DashboardPage({ orgId, orgSlug, orgPlan }: DashboardPageProps) {
	const supabase = createAdminClient();
	const archiveCutoff = getArchiveCutoff(orgPlan);

	let digestsQuery = supabase
		.from("digests")
		.select("id, week_of, content_md, content_html, generated_at")
		.eq("org_id", orgId)
		.order("week_of", { ascending: false })
		.limit(10);

	let insightsQuery = supabase
		.from("insights")
		.select("id, type, importance_score, summary, diff_detail, week_of, competitors(name)")
		.eq("org_id", orgId)
		.order("importance_score", { ascending: false })
		.limit(20);

	// Apply archive limit (null = unlimited, cutoff date = filter)
	if (archiveCutoff) {
		digestsQuery = digestsQuery.gte("generated_at", archiveCutoff);
		insightsQuery = insightsQuery.gte("created_at", archiveCutoff);
	}

	const [digestsResult, insightsResult] = await Promise.all([digestsQuery, insightsQuery]);

	const digests = digestsResult.data ?? [];
	const insights = (insightsResult.data ?? []) as InsightRow[];

	// Group insights by type for section-based display
	const grouped = new Map<InsightType, InsightRow[]>();
	for (const insight of insights) {
		const key = insight.type as InsightType;
		const list = grouped.get(key);
		if (list) {
			list.push(insight);
		} else {
			grouped.set(key, [insight]);
		}
	}

	// Latest week label
	const firstInsight = insights[0];
	const latestWeek = firstInsight ? formatWeekDate(firstInsight.week_of) : null;

	return (
		<>
			<section className="mb-8">
				<h2 className="mb-4 text-lg font-semibold text-text-primary">
					{latestWeek ? `Insights — Week of ${latestWeek}` : "This Week\u2019s Insights"}
				</h2>
				{insights.length > 0 ? (
					<div className="space-y-6">
						{SECTION_ORDER.filter((s) => grouped.has(s.key)).map((section) => {
							const sectionInsights = grouped.get(section.key) ?? [];
							const config = getInsightConfig(section.key);
							return (
								<div key={section.key}>
									<div className="mb-2 flex items-center gap-2">
										<svg
											width="16"
											height="16"
											viewBox="0 0 16 16"
											fill={config.text}
											aria-hidden="true"
										>
											<path d={config.iconPath} />
										</svg>
										<h3 className="text-sm font-semibold text-text-primary">
											{section.title}
											<span className="ml-1.5 text-xs font-normal text-text-tertiary">
												({sectionInsights.length})
											</span>
										</h3>
									</div>
									<div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
										{sectionInsights.map((insight) => {
											const competitor = insight.competitors as unknown as {
												name: string;
											} | null;
											return (
												<InsightCard
													key={insight.id}
													type={insight.type}
													competitorName={competitor?.name ?? "Unknown"}
													summary={insight.summary}
													diffDetail={insight.diff_detail ?? {}}
												/>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="rounded-[3px] border border-border bg-white px-6 py-10 text-center">
						<p className="text-sm text-text-tertiary">
							No insights yet. Check back after the next analysis run.
						</p>
					</div>
				)}
			</section>

			<section>
				<h2 className="mb-4 text-lg font-semibold text-text-primary">Recent Digests</h2>
				{digests.length > 0 ? (
					<div className="flex flex-col gap-3">
						{digests.map((digest) => (
							<DigestListItem
								key={digest.id}
								id={digest.id}
								weekOf={digest.week_of}
								generatedAt={digest.generated_at}
								orgSlug={orgSlug}
								contentMd={digest.content_md}
							/>
						))}
					</div>
				) : (
					<div className="rounded-[3px] border border-border bg-white px-6 py-10 text-center">
						<p className="text-sm text-text-tertiary">
							No digests yet. Your first digest will appear here after the weekly pipeline runs.
						</p>
					</div>
				)}
			</section>
		</>
	);
}
