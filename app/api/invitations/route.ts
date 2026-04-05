import { isErrorResponse, requireUser, zodErrorResponse } from "@/lib/api";
import { sendInvitationEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { z } from "zod";

const createInvitationSchema = z.object({
	orgId: z.string().uuid(),
	email: z.string().email(),
	role: z.enum(["member", "owner"]).default("member"),
});

export async function POST(request: Request) {
	try {
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { user, supabase } = auth;

		const body: unknown = await request.json();
		const parsed = createInvitationSchema.safeParse(body);
		if (!parsed.success) return zodErrorResponse(parsed);

		const { orgId, email, role } = parsed.data;

		// Run independent queries in parallel
		const [membershipResult, orgResult, memberCountResult, pendingCountResult] = await Promise.all([
			supabase
				.from("organization_members")
				.select("role")
				.eq("org_id", orgId)
				.eq("user_id", user.id)
				.single(),
			supabase.from("organizations").select("id, name, max_members").eq("id", orgId).single(),
			supabase
				.from("organization_members")
				.select("id", { count: "exact", head: true })
				.eq("org_id", orgId),
			supabase
				.from("invitations")
				.select("id", { count: "exact", head: true })
				.eq("org_id", orgId)
				.eq("status", "pending"),
		]);

		if (!membershipResult.data || membershipResult.data.role !== "owner") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		if (!orgResult.data) {
			return NextResponse.json({ error: "Organization not found" }, { status: 404 });
		}

		const org = orgResult.data;
		const memberCount = memberCountResult.count ?? 0;
		const pendingCount = pendingCountResult.count ?? 0;

		if (org.max_members && memberCount + pendingCount >= org.max_members) {
			return NextResponse.json(
				{ error: "Organization has reached its member limit" },
				{ status: 422 },
			);
		}

		// Check if email is already a member via DB join (avoids auth.admin.listUsers)
		const { data: existingMember } = await supabase.rpc("check_email_is_org_member", {
			check_org_id: orgId,
			check_email: email,
		});

		// Fallback: if RPC doesn't exist, skip check (RLS + unique constraint will catch duplicates)
		if (existingMember === true) {
			return NextResponse.json(
				{ error: "User is already a member of this organization" },
				{ status: 409 },
			);
		}

		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		const { data: invitation, error: insertError } = await supabase
			.from("invitations")
			.insert({
				org_id: orgId,
				email,
				role,
				invited_by: user.id,
				expires_at: expiresAt.toISOString(),
			})
			.select()
			.single();

		if (insertError) {
			if (insertError.code === "23505") {
				return NextResponse.json(
					{ error: "A pending invitation already exists for this email" },
					{ status: 409 },
				);
			}
			return NextResponse.json({ error: insertError.message }, { status: 500 });
		}

		const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
		try {
			await sendInvitationEmail({
				to: email,
				orgName: org.name,
				inviterEmail: user.email ?? "Unknown",
				inviteUrl: `${appUrl}/invite/${invitation.token}`,
			});
		} catch {
			console.error("Failed to send invitation email");
		}

		return NextResponse.json(invitation, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

const listInvitationsSchema = z.object({
	orgId: z.string().uuid(),
});

export async function GET(request: Request) {
	try {
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { user, supabase } = auth;

		const { searchParams } = new URL(request.url);
		const parsed = listInvitationsSchema.safeParse({ orgId: searchParams.get("orgId") });
		if (!parsed.success) return zodErrorResponse(parsed);

		const { orgId } = parsed.data;

		const { data: membership } = await supabase
			.from("organization_members")
			.select("role")
			.eq("org_id", orgId)
			.eq("user_id", user.id)
			.single();

		if (!membership || membership.role !== "owner") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { data: invitations, error } = await supabase
			.from("invitations")
			.select("*")
			.eq("org_id", orgId)
			.eq("status", "pending")
			.order("created_at", { ascending: false });

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json(invitations);
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
