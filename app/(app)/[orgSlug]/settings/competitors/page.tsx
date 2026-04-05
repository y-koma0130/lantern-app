import { AddCompetitorForm } from "@/features/settings/components/add-competitor-form";
import { CompetitorList } from "@/features/settings/components/competitor-list";
import { getOrgContext } from "@/lib/queries/get-org-context";
import { createClient } from "@/lib/supabase/server";

interface CompetitorsPageProps {
	params: Promise<{ orgSlug: string }>;
}

export default async function CompetitorsPage({ params }: CompetitorsPageProps) {
	const { orgSlug } = await params;
	const { orgId, isOwner } = await getOrgContext(orgSlug);

	const supabase = await createClient();
	const { data: competitors } = await supabase
		.from("competitors")
		.select("id, name, website, g2_url, niche")
		.eq("org_id", orgId)
		.order("created_at", { ascending: false });

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-[#172B4D]">Competitors</h2>
				<p className="mt-1 text-sm text-[#505F79]">
					Manage the competitors your organization is tracking.
				</p>
			</div>

			{isOwner && <AddCompetitorForm orgId={orgId} />}

			<CompetitorList competitors={competitors ?? []} orgId={orgId} isOwner={isOwner} />
		</div>
	);
}
