import { isErrorResponse, requireUser, zodErrorResponse } from "@/lib/api";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const createCompetitorSchema = z.object({
	name: z.string().min(1).max(200),
	website: z.string().url(),
	g2Url: z.string().url().nullable().optional(),
	githubOrg: z.string().nullable().optional(),
	linkedinSlug: z.string().nullable().optional(),
	crunchbaseSlug: z.string().nullable().optional(),
	niche: z.string().min(1).max(200),
});

const deleteCompetitorSchema = z.object({
	competitorId: z.string().uuid(),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ orgId: string }> },
) {
	try {
		const { orgId } = await params;
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { supabase } = auth;

		const body = await request.json();
		const parsed = createCompetitorSchema.safeParse(body);
		if (!parsed.success) return zodErrorResponse(parsed);

		// Parallel: fetch org limits and current count
		const [orgResult, countResult] = await Promise.all([
			supabase.from("organizations").select("max_competitors").eq("id", orgId).single(),
			supabase.from("competitors").select("id", { count: "exact", head: true }).eq("org_id", orgId),
		]);

		if (orgResult.error || !orgResult.data) {
			return NextResponse.json({ error: "Organization not found" }, { status: 404 });
		}

		if ((countResult.count ?? 0) >= orgResult.data.max_competitors) {
			return NextResponse.json(
				{
					error: `You've reached the limit of ${orgResult.data.max_competitors} competitors on your current plan. Upgrade your plan to track more competitors.`,
					code: "COMPETITOR_LIMIT_REACHED",
				},
				{ status: 422 },
			);
		}

		const { name, website, g2Url, githubOrg, linkedinSlug, crunchbaseSlug, niche } = parsed.data;

		const { data: competitor, error } = await supabase
			.from("competitors")
			.insert({
				org_id: orgId,
				name,
				website,
				g2_url: g2Url ?? null,
				github_org: githubOrg ?? null,
				linkedin_slug: linkedinSlug ?? null,
				crunchbase_slug: crunchbaseSlug ?? null,
				niche,
			})
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json(competitor, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ orgId: string }> },
) {
	try {
		const { orgId } = await params;
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { supabase } = auth;

		const { data, error } = await supabase.from("competitors").select("*").eq("org_id", orgId);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json(data ?? []);
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
		const parsed = deleteCompetitorSchema.safeParse(body);
		if (!parsed.success) return zodErrorResponse(parsed);

		const { error } = await supabase
			.from("competitors")
			.delete()
			.eq("id", parsed.data.competitorId)
			.eq("org_id", orgId);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
