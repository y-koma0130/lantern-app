import { isErrorResponse, requireUser, zodErrorResponse } from "@/lib/api";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const removeMemberSchema = z.object({
	userId: z.string().uuid(),
});

const updateRoleSchema = z.object({
	userId: z.string().uuid(),
	role: z.enum(["owner", "member"]),
});

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ orgId: string }> },
) {
	try {
		const { orgId } = await params;
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { supabase } = auth;

		const { data, error } = await supabase
			.from("organization_members")
			.select("id, user_id, role, created_at")
			.eq("org_id", orgId);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		const members = (data ?? []).map((m) => ({
			id: m.id,
			userId: m.user_id,
			role: m.role,
			createdAt: m.created_at,
		}));

		return NextResponse.json(members);
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ orgId: string }> },
) {
	try {
		const { orgId } = await params;
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { supabase } = auth;

		const body = await request.json();
		const parsed = removeMemberSchema.safeParse(body);
		if (!parsed.success) return zodErrorResponse(parsed);

		const { userId } = parsed.data;

		// Single query: fetch all owners with user_id
		const { data: owners } = await supabase
			.from("organization_members")
			.select("id, user_id")
			.eq("org_id", orgId)
			.eq("role", "owner");

		const isTargetOwner = owners?.some((o) => o.user_id === userId);

		if (isTargetOwner && (owners?.length ?? 0) <= 1) {
			return NextResponse.json({ error: "Cannot remove the last owner" }, { status: 400 });
		}

		const { error } = await supabase
			.from("organization_members")
			.delete()
			.eq("org_id", orgId)
			.eq("user_id", userId);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ orgId: string }> },
) {
	try {
		const { orgId } = await params;
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { supabase } = auth;

		const body = await request.json();
		const parsed = updateRoleSchema.safeParse(body);
		if (!parsed.success) return zodErrorResponse(parsed);

		const { userId, role } = parsed.data;

		if (role === "member") {
			const { data: owners } = await supabase
				.from("organization_members")
				.select("id, user_id")
				.eq("org_id", orgId)
				.eq("role", "owner");

			const isTargetOwner = owners?.some((o) => o.user_id === userId);

			if (isTargetOwner && (owners?.length ?? 0) <= 1) {
				return NextResponse.json({ error: "Cannot demote the last owner" }, { status: 400 });
			}
		}

		const { data: member, error } = await supabase
			.from("organization_members")
			.update({ role })
			.eq("org_id", orgId)
			.eq("user_id", userId)
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({
			id: member.id,
			userId: member.user_id,
			role: member.role,
			createdAt: member.created_at,
		});
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
