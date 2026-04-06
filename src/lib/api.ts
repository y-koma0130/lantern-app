import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { SafeParseReturnType } from "zod";
import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";

interface AuthUser {
	id: string;
	email?: string;
}

interface AuthResult {
	user: AuthUser;
	supabase: SupabaseClient;
}

export async function requireUser(): Promise<AuthResult | NextResponse> {
	const authClient = await createClient();
	const {
		data: { user },
	} = await authClient.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const supabase = createAdminClient();

	return { user, supabase };
}

export function isErrorResponse(result: AuthResult | NextResponse): result is NextResponse {
	return result instanceof NextResponse;
}

export function zodErrorResponse(parsed: SafeParseReturnType<unknown, unknown>): NextResponse {
	const message = !parsed.success
		? (parsed.error.errors[0]?.message ?? "Invalid request body")
		: "Unknown error";
	return NextResponse.json({ error: message }, { status: 400 });
}

export async function requireOrgOwner(
	supabase: SupabaseClient,
	orgId: string,
	userId: string,
): Promise<NextResponse | null> {
	const { data: membership } = await supabase
		.from("organization_members")
		.select("role")
		.eq("org_id", orgId)
		.eq("user_id", userId)
		.single();

	if (!membership) {
		return NextResponse.json({ error: "Organization not found" }, { status: 404 });
	}

	if (membership.role !== "owner") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	return null;
}

export async function setLastActiveOrg(
	supabase: SupabaseClient,
	userId: string,
	orgId: string,
): Promise<void> {
	await supabase
		.from("user_preferences")
		.upsert({ user_id: userId, last_active_org_id: orgId }, { onConflict: "user_id" });
}
