import { isErrorResponse, requireOrgOwner, requireUser, zodErrorResponse } from "@/lib/api";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { z } from "zod";

const portalSchema = z.object({
	orgId: z.string().uuid(),
});

export async function POST(request: Request) {
	try {
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { user, supabase } = auth;

		const body = await request.json();
		const parsed = portalSchema.safeParse(body);
		if (!parsed.success) return zodErrorResponse(parsed);

		const { orgId } = parsed.data;

		const [ownerError, { data: org }] = await Promise.all([
			requireOrgOwner(supabase, orgId, user.id),
			supabase.from("organizations").select("stripe_customer_id, slug").eq("id", orgId).single(),
		]);

		if (ownerError) return ownerError;
		if (!org?.stripe_customer_id) {
			return NextResponse.json({ error: "No billing account found" }, { status: 400 });
		}

		const stripe = getStripe();
		const session = await stripe.billingPortal.sessions.create({
			customer: org.stripe_customer_id as string,
			return_url: `${getAppUrl()}/${org.slug}/billing`,
		});

		return NextResponse.json({ url: session.url });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
