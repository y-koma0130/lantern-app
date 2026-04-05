import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface OrgContext {
	orgId: string;
	orgName: string;
	orgSlug: string;
	isOwner: boolean;
	userId: string;
}

export async function getOrgContext(orgSlug: string): Promise<OrgContext> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const { data: org } = await supabase
		.from("organizations")
		.select(
			"id, name, slug, plan, channel_email, channel_slack, channel_discord, digest_frequency, max_competitors, max_members",
		)
		.eq("slug", orgSlug)
		.single();

	if (!org) {
		redirect("/");
	}

	const { data: membership } = await supabase
		.from("organization_members")
		.select("role")
		.eq("org_id", org.id)
		.eq("user_id", user.id)
		.single();

	if (!membership) {
		redirect("/");
	}

	return {
		orgId: org.id,
		orgName: org.name,
		orgSlug: org.slug,
		isOwner: membership.role === "owner",
		userId: user.id,
	};
}
