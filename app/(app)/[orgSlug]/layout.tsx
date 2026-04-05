import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

interface OrgLayoutProps {
	children: ReactNode;
	params: Promise<{ orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
	const { orgSlug } = await params;
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	// Fetch the org by slug
	const { data: org } = await supabase
		.from("organizations")
		.select("id, name, slug")
		.eq("slug", orgSlug)
		.single();

	if (!org) {
		// Org not found — redirect to first available org or onboarding
		const { data: memberships } = await supabase
			.from("organization_members")
			.select("organizations(slug)")
			.eq("user_id", user.id)
			.limit(1);

		const firstOrg = memberships?.[0]?.organizations as unknown as { slug: string } | null;
		if (firstOrg?.slug) {
			redirect(`/${firstOrg.slug}/dashboard`);
		}
		redirect("/onboarding");
	}

	// Verify user is a member
	const { data: membership } = await supabase
		.from("organization_members")
		.select("role")
		.eq("org_id", org.id)
		.eq("user_id", user.id)
		.single();

	if (!membership) {
		// Not a member — redirect to first available org
		const { data: memberships } = await supabase
			.from("organization_members")
			.select("organizations(slug)")
			.eq("user_id", user.id)
			.limit(1);

		const firstOrg = memberships?.[0]?.organizations as unknown as { slug: string } | null;
		if (firstOrg?.slug) {
			redirect(`/${firstOrg.slug}/dashboard`);
		}
		redirect("/onboarding");
	}

	// Fire-and-forget: update last active org
	supabase
		.from("user_preferences")
		.upsert({ user_id: user.id, last_active_org_id: org.id }, { onConflict: "user_id" })
		.then();

	return <>{children}</>;
}
