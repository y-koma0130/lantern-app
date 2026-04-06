import { isErrorResponse, requireUser, zodErrorResponse } from "@/lib/api";
import { UPGRADE_MESSAGES, canUseSlackDiscord } from "@/lib/plan-limits";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateOrgSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	slug: z
		.string()
		.min(1)
		.max(100)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens only")
		.optional(),
	channelEmail: z.boolean().optional(),
	channelSlack: z.string().nullable().optional(),
	channelDiscord: z.string().nullable().optional(),
	digestFrequency: z.enum(["monthly", "weekly"]).optional(),
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

		const { data: org, error } = await supabase
			.from("organizations")
			.select("*")
			.eq("id", orgId)
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		if (!org) {
			return NextResponse.json({ error: "Organization not found" }, { status: 404 });
		}

		return NextResponse.json(org);
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
		const parsed = updateOrgSchema.safeParse(body);
		if (!parsed.success) return zodErrorResponse(parsed);

		const { channelSlack, channelDiscord } = parsed.data;

		// Check plan-based access for Slack/Discord webhooks
		if (channelSlack !== undefined || channelDiscord !== undefined) {
			const { data: orgData } = await supabase
				.from("organizations")
				.select("plan")
				.eq("id", orgId)
				.single();

			const plan = orgData?.plan ?? "free";
			if (!canUseSlackDiscord(plan)) {
				return NextResponse.json({ error: UPGRADE_MESSAGES.slackDiscord }, { status: 403 });
			}
		}

		const updates: Record<string, unknown> = {};
		const { name, slug, channelEmail, digestFrequency } = parsed.data;

		if (name !== undefined) updates.name = name;
		if (slug !== undefined) updates.slug = slug;
		if (channelEmail !== undefined) updates.channel_email = channelEmail;
		if (channelSlack !== undefined) updates.channel_slack = channelSlack;
		if (channelDiscord !== undefined) updates.channel_discord = channelDiscord;
		if (digestFrequency !== undefined) updates.digest_frequency = digestFrequency;

		if (Object.keys(updates).length === 0) {
			return NextResponse.json({ error: "No fields to update" }, { status: 400 });
		}

		const { data: org, error } = await supabase
			.from("organizations")
			.update(updates)
			.eq("id", orgId)
			.select()
			.single();

		if (error) {
			if (error.code === "23505") {
				return NextResponse.json({ error: "Slug is already taken" }, { status: 409 });
			}
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json(org);
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
