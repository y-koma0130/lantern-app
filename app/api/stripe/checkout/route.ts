import { isErrorResponse, requireOrgOwner, requireUser, zodErrorResponse } from "@/lib/api";
import { PLANS, getAppUrl, getStripe, getStripePriceId } from "@/lib/stripe";
import type { PlanId } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { z } from "zod";

const checkoutSchema = z.object({
	orgId: z.string().uuid(),
	plan: z.enum(["starter", "pro", "team"]),
	interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function POST(request: Request) {
	try {
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { user, supabase } = auth;

		const body = await request.json();
		const parsed = checkoutSchema.safeParse(body);
		if (!parsed.success) return zodErrorResponse(parsed);

		const { orgId, plan, interval } = parsed.data;

		const [ownerError, { data: org }] = await Promise.all([
			requireOrgOwner(supabase, orgId, user.id),
			supabase
				.from("organizations")
				.select("id, slug, stripe_customer_id")
				.eq("id", orgId)
				.single(),
		]);

		if (ownerError) return ownerError;
		if (!org) {
			return NextResponse.json({ error: "Organization not found" }, { status: 404 });
		}

		const priceId = getStripePriceId(plan as PlanId, interval);
		if (!priceId) {
			return NextResponse.json({ error: "Price not configured for this plan" }, { status: 400 });
		}

		const stripe = getStripe();
		let customerId = org.stripe_customer_id as string | null;

		if (!customerId) {
			const customer = await stripe.customers.create({
				email: user.email,
				metadata: { org_id: orgId },
			});
			customerId = customer.id;

			await supabase
				.from("organizations")
				.update({ stripe_customer_id: customerId })
				.eq("id", orgId);
		}

		const appUrl = getAppUrl();
		const session = await stripe.checkout.sessions.create({
			mode: "subscription",
			customer: customerId,
			line_items: [{ price: priceId, quantity: 1 }],
			success_url: `${appUrl}/${org.slug}/billing?success=true`,
			cancel_url: `${appUrl}/${org.slug}/billing?canceled=true`,
			metadata: { org_id: orgId, plan },
			subscription_data: {
				metadata: { org_id: orgId },
			},
		});

		return NextResponse.json({ url: session.url });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
