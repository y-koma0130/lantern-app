import { supabase } from "./db.js";
import type { Organization } from "./types.js";

export async function fetchActiveOrganizations(): Promise<Organization[]> {
	const { data, error } = await supabase.from("organizations").select("*");

	if (error) {
		throw new Error(`Failed to fetch organizations: ${error.message}`);
	}

	return (data ?? []) as Organization[];
}

export async function fetchOrgMembers(orgId: string): Promise<{ email: string }[]> {
	const { data, error } = await supabase
		.from("organization_members")
		.select("user_id, users!inner(email)")
		.eq("org_id", orgId);

	if (error) {
		throw new Error(`Failed to fetch org members: ${error.message}`);
	}

	const rows = (data ?? []) as unknown as { users: { email: string } }[];
	return rows.map((row) => ({
		email: row.users.email,
	}));
}
