import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

interface OrgGuardProps {
	orgSlug: string;
	children: ReactNode;
}

export async function OrgGuard({ orgSlug, children }: OrgGuardProps) {
	const authClient = await createClient();
	const {
		data: { user },
	} = await authClient.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const supabase = createAdminClient();

	const { data: org } = await supabase
		.from("organizations")
		.select("id, name, slug")
		.eq("slug", orgSlug)
		.single();

	if (!org) {
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

	const { data: membership } = await supabase
		.from("organization_members")
		.select("role")
		.eq("org_id", org.id)
		.eq("user_id", user.id)
		.single();

	if (!membership) {
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

	// Fire-and-forget
	supabase
		.from("user_preferences")
		.upsert({ user_id: user.id, last_active_org_id: org.id }, { onConflict: "user_id" })
		.then();

	return <>{children}</>;
}
