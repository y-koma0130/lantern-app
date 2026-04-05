import { isErrorResponse, requireUser, setLastActiveOrg, zodErrorResponse } from "@/lib/api";
import { NextResponse } from "next/server";
import { z } from "zod";

const acceptInvitationSchema = z.object({
	token: z.string().uuid(),
});

export async function POST(request: Request) {
	try {
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { user, supabase } = auth;

		const body: unknown = await request.json();
		const parsed = acceptInvitationSchema.safeParse(body);
		if (!parsed.success) return zodErrorResponse(parsed);

		const { token } = parsed.data;

		const { data: invitation } = await supabase
			.from("invitations")
			.select("*, organizations(id, name, slug)")
			.eq("token", token)
			.single();

		if (!invitation) {
			return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
		}

		if (invitation.status !== "pending") {
			return NextResponse.json({ error: "Invitation is no longer valid" }, { status: 410 });
		}

		if (new Date(invitation.expires_at) < new Date()) {
			return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
		}

		if (invitation.email !== user.email) {
			return NextResponse.json(
				{ error: "This invitation was sent to a different email address" },
				{ status: 403 },
			);
		}

		const { error: memberError } = await supabase.from("organization_members").insert({
			org_id: invitation.org_id,
			user_id: user.id,
			role: invitation.role,
		});

		if (memberError) {
			if (memberError.code === "23505") {
				return NextResponse.json(
					{ error: "You are already a member of this organization" },
					{ status: 409 },
				);
			}
			return NextResponse.json({ error: memberError.message }, { status: 500 });
		}

		// These are independent — run in parallel
		await Promise.all([
			supabase.from("invitations").update({ status: "accepted" }).eq("id", invitation.id),
			setLastActiveOrg(supabase, user.id, invitation.org_id),
		]);

		return NextResponse.json({ organization: invitation.organizations });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
