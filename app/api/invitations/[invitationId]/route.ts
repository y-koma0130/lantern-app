import { isErrorResponse, requireUser } from "@/lib/api";
import { NextResponse } from "next/server";

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ invitationId: string }> },
) {
	try {
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { user, supabase } = auth;

		const { invitationId } = await params;

		const { data: invitation } = await supabase
			.from("invitations")
			.select("id, org_id, status")
			.eq("id", invitationId)
			.single();

		if (!invitation) {
			return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
		}

		if (invitation.status !== "pending") {
			return NextResponse.json(
				{ error: "Only pending invitations can be revoked" },
				{ status: 422 },
			);
		}

		const { data: membership } = await supabase
			.from("organization_members")
			.select("role")
			.eq("org_id", invitation.org_id)
			.eq("user_id", user.id)
			.single();

		if (!membership || membership.role !== "owner") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Filter on status to prevent TOCTOU race
		const { error } = await supabase
			.from("invitations")
			.update({ status: "revoked" })
			.eq("id", invitationId)
			.eq("status", "pending");

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
