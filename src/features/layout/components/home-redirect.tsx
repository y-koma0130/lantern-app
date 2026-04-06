import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function HomeRedirect(): Promise<never> {
	const authClient = await createClient();
	const {
		data: { user },
	} = await authClient.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const supabase = createAdminClient();

	const { data: prefs } = await supabase
		.from("user_preferences")
		.select("last_active_org_id, organizations(slug)")
		.eq("user_id", user.id)
		.single();

	const lastOrg = prefs?.organizations as unknown as { slug: string } | null;
	if (lastOrg?.slug) {
		redirect(`/${lastOrg.slug}/dashboard`);
	}

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
