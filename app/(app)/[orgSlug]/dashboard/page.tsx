import { DigestListItem } from "@/features/dashboard/components/digest-list-item";
import { InsightCard } from "@/features/dashboard/components/insight-card";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface DashboardPageProps {
	params: Promise<{ orgSlug: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
	const { orgSlug } = await params;
	const supabase = await createClient();

	// Fetch org by slug
	const { data: org } = await supabase
		.from("organizations")
		.select("id, name, slug")
		.eq("slug", orgSlug)
		.single();

	if (!org) {
		notFound();
	}

	// Fetch recent digests and top insights in parallel
	const [digestsResult, insightsResult] = await Promise.all([
		supabase
			.from("digests")
			.select("id, week_of, content_md, content_html, generated_at")
			.eq("org_id", org.id)
			.order("week_of", { ascending: false })
			.limit(10),
		supabase
			.from("insights")
			.select("id, type, importance_score, summary, week_of, competitors(name)")
			.eq("org_id", org.id)
			.order("importance_score", { ascending: false })
			.limit(5),
	]);

	const digests = digestsResult.data ?? [];
	const insights = insightsResult.data ?? [];

	return (
		<div className="min-h-full bg-[#FAFBFC]">
			<div className="mx-auto max-w-4xl px-6 py-8">
				<h1 className="mb-6 text-xl font-semibold text-[#172B4D]">Dashboard</h1>

				{/* Top Insights */}
				<section className="mb-8">
					<h2 className="mb-4 text-lg font-semibold text-[#172B4D]">
						This Week&apos;s Top Changes
					</h2>
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
							<svg
								width="40"
								height="40"
								viewBox="0 0 40 40"
								fill="none"
								className="mx-auto mb-3"
								role="img"
								aria-labelledby="no-insights-icon"
							>
								<title id="no-insights-icon">No insights</title>
								<circle cx="20" cy="20" r="18" stroke="#DFE1E6" strokeWidth="2" />
								<path
									d="M14 20L18 24L26 16"
									stroke="#DFE1E6"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							<p className="text-sm text-[#97A0AF]">
								No insights yet. Check back after the next analysis run.
							</p>
						</div>
					)}
				</section>

				{/* Digest List */}
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
							<svg
								width="40"
								height="40"
								viewBox="0 0 40 40"
								fill="none"
								className="mx-auto mb-3"
								role="img"
								aria-labelledby="no-digests-icon"
							>
								<title id="no-digests-icon">No digests</title>
								<rect x="8" y="6" width="24" height="28" rx="2" stroke="#DFE1E6" strokeWidth="2" />
								<path
									d="M14 14H26M14 20H26M14 26H22"
									stroke="#DFE1E6"
									strokeWidth="2"
									strokeLinecap="round"
								/>
							</svg>
							<p className="text-sm text-[#97A0AF]">
								No digests yet. Your first digest will appear here after the weekly pipeline runs.
							</p>
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
