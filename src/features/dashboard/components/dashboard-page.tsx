import { DigestListItem } from "@/features/dashboard/components/digest-list-item";
import { InsightCard } from "@/features/dashboard/components/insight-card";
import { createAdminClient } from "@/lib/supabase/admin";

interface DashboardPageProps {
	orgId: string;
	orgSlug: string;
}

export async function DashboardPage({ orgId, orgSlug }: DashboardPageProps) {
	const supabase = createAdminClient();

	const [digestsResult, insightsResult] = await Promise.all([
		supabase
			.from("digests")
			.select("id, week_of, content_md, content_html, generated_at")
			.eq("org_id", orgId)
			.order("week_of", { ascending: false })
			.limit(10),
		supabase
			.from("insights")
			.select("id, type, importance_score, summary, week_of, competitors(name)")
			.eq("org_id", orgId)
			.order("importance_score", { ascending: false })
			.limit(5),
	]);

	const digests = digestsResult.data ?? [];
	const insights = insightsResult.data ?? [];

	return (
		<>
			<section className="mb-8">
				<h2 className="mb-4 text-lg font-semibold text-[#172B4D]">This Week&apos;s Top Changes</h2>
				{insights.length > 0 ? (
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{insights.map((insight) => {
							const competitor = insight.competitors as unknown as { name: string } | null;
							return (
								<InsightCard
									key={insight.id}
									type={insight.type}
									competitorName={competitor?.name ?? "Unknown"}
									summary={insight.summary}
									importanceScore={insight.importance_score}
								/>
							);
						})}
					</div>
				) : (
					<div className="rounded-[3px] border border-[#DFE1E6] bg-white px-6 py-10 text-center">
						<p className="text-sm text-[#97A0AF]">
							No insights yet. Check back after the next analysis run.
						</p>
					</div>
				)}
			</section>

			<section>
				<h2 className="mb-4 text-lg font-semibold text-[#172B4D]">Recent Digests</h2>
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
					<div className="rounded-[3px] border border-[#DFE1E6] bg-white px-6 py-10 text-center">
						<p className="text-sm text-[#97A0AF]">
							No digests yet. Your first digest will appear here after the weekly pipeline runs.
						</p>
					</div>
				)}
			</section>
		</>
	);
}
