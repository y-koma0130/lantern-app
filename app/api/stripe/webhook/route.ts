import { PLANS, getPlanFromPriceId, getStripe } from "@/lib/stripe";
import type { PlanId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

async function applyPlanToOrg(
	orgId: string,
	plan: PlanId,
	extras?: { stripeCustomerId?: string; stripeSubscriptionId?: string | null },
) {
	const supabase = createAdminClient();
	const planConfig = PLANS[plan];

	const { error } = await supabase
		.from("organizations")
		.update({
			plan,
			max_competitors: planConfig.competitors,
			max_members: planConfig.members,
			digest_frequency: planConfig.frequency,
			...(extras?.stripeCustomerId && { stripe_customer_id: extras.stripeCustomerId }),
			...(extras?.stripeSubscriptionId !== undefined && {
				stripe_subscription_id: extras.stripeSubscriptionId,
			}),
		})
		.eq("id", orgId);

	if (error) {
		console.error(`[Webhook] Failed to update org ${orgId}:`, error.message);
	}
}

export async function POST(request: Request) {
	try {
		const stripe = getStripe();
		const body = await request.text();
		const signature = request.headers.get("stripe-signature");

		if (!signature) {
			return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
		}

		const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
		if (!webhookSecret) {
			return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
		}

		let event: Stripe.Event;
		try {
			event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
		} catch {
			return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
		}

		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;
				const orgId = session.metadata?.org_id;
				const planFromMetadata = session.metadata?.plan as PlanId | undefined;
				if (!orgId) break;

				const subscriptionId =
					typeof session.subscription === "string"
						? session.subscription
						: session.subscription?.id;
				const customerId =
					typeof session.customer === "string" ? session.customer : session.customer?.id;

				// Use plan from metadata (set at checkout creation) — avoids extra Stripe API call
				let plan = planFromMetadata;
				if (!plan && subscriptionId) {
					const subscription = await stripe.subscriptions.retrieve(subscriptionId);
					const priceId = subscription.items.data[0]?.price.id;
					if (priceId) plan = getPlanFromPriceId(priceId) ?? undefined;
				}

				if (plan) {
					await applyPlanToOrg(orgId, plan, {
						stripeCustomerId: customerId ?? undefined,
						stripeSubscriptionId: subscriptionId,
					});
				}

				break;
			}

			case "customer.subscription.updated": {
				const subscription = event.data.object as Stripe.Subscription;
				const orgId = subscription.metadata?.org_id;
				if (!orgId) break;

				const priceId = subscription.items.data[0]?.price.id;
				if (!priceId) break;

				const plan = getPlanFromPriceId(priceId);
				if (!plan) break;

				await applyPlanToOrg(orgId, plan);
				break;
			}

			case "customer.subscription.deleted": {
				const subscription = event.data.object as Stripe.Subscription;
				const orgId = subscription.metadata?.org_id;
				if (!orgId) break;

				await applyPlanToOrg(orgId, "free", { stripeSubscriptionId: null });
				break;
			}

			default:
				break;
		}

		return NextResponse.json({ received: true });
	} catch (err) {
		console.error("[Webhook] Unhandled error:", err);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
