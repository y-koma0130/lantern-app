import { AddCompetitorForm } from "@/features/settings/components/add-competitor-form";
import { CompetitorList } from "@/features/settings/components/competitor-list";
import { getOrgContext } from "@/lib/queries/get-org-context";
import { createAdminClient } from "@/lib/supabase/admin";

interface CompetitorsPageProps {
	orgSlug: string;
}

export async function CompetitorsPage({ orgSlug }: CompetitorsPageProps) {
	const { orgId, orgSlug: slug, isOwner } = await getOrgContext(orgSlug);

	const supabase = createAdminClient();
	const { data: competitors } = await supabase
		.from("competitors")
		.select("id, name, website, g2_url, niche")
		.eq("org_id", orgId)
		.order("created_at", { ascending: false });

	return (
		<>
			{isOwner && (
				<AddCompetitorForm
					orgId={orgId}
					orgSlug={slug}
					existingCompetitorNames={(competitors ?? []).map((c) => c.name)}
				/>
			)}
			<CompetitorList competitors={competitors ?? []} orgId={orgId} isOwner={isOwner} />
		</>
	);
}
