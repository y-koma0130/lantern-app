import { isErrorResponse, requireUser, setLastActiveOrg, zodErrorResponse } from "@/lib/api";
import { NextResponse } from "next/server";
import { z } from "zod";

const createOrgSchema = z.object({
	name: z.string().min(1).max(100),
	slug: z
		.string()
		.min(1)
		.max(100)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens only"),
});

export async function POST(request: Request) {
	try {
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { user, supabase } = auth;

		const body = await request.json();
		const parsed = createOrgSchema.safeParse(body);
		if (!parsed.success) return zodErrorResponse(parsed);

		const { name, slug } = parsed.data;

		const { data: org, error: orgError } = await supabase
			.from("organizations")
			.insert({ name, slug })
			.select()
			.single();

		if (orgError) {
			// Unique constraint on slug
			if (orgError.code === "23505") {
				return NextResponse.json({ error: "Slug is already taken" }, { status: 409 });
			}
			return NextResponse.json({ error: orgError.message }, { status: 500 });
		}

		await setLastActiveOrg(supabase, user.id, org.id);

		return NextResponse.json(org, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function GET() {
	try {
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { user, supabase } = auth;

		const { data, error } = await supabase
			.from("organization_members")
			.select("role, organizations(*)")
			.eq("user_id", user.id);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		const organizations = (data ?? []).map((m) => ({
			...m.organizations,
			role: m.role,
		}));

		return NextResponse.json(organizations);
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
