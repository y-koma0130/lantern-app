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
	if (!planConfig) {
		console.error(`[Webhook] Unknown plan: ${plan}`);
		return;
	}

	console.log(`[Webhook] Updating org ${orgId} to plan: ${plan}`, {
		max_competitors: planConfig.competitors,
		max_members: planConfig.members,
		digest_frequency: planConfig.frequency,
		...extras,
	});

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
	} else {
		console.log(`[Webhook] Successfully updated org ${orgId} to ${plan}`);
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
		} catch (err) {
			console.error("[Webhook] Signature verification failed:", err);
			return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
		}

		console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;
				const orgId = session.metadata?.org_id;
				const planFromMetadata = session.metadata?.plan as PlanId | undefined;

				console.log("[Webhook] checkout.session.completed metadata:", {
					org_id: orgId,
					plan: planFromMetadata,
					customer: session.customer,
					subscription: session.subscription,
				});

				if (!orgId) {
					console.warn("[Webhook] No org_id in session metadata, skipping");
					break;
				}

				const subscriptionId =
					typeof session.subscription === "string"
						? session.subscription
						: session.subscription?.id;
				const customerId =
					typeof session.customer === "string" ? session.customer : session.customer?.id;

				let plan = planFromMetadata;
				if (!plan && subscriptionId) {
					console.log("[Webhook] No plan in metadata, retrieving from subscription...");
					const subscription = await stripe.subscriptions.retrieve(subscriptionId);
					const priceId = subscription.items.data[0]?.price.id;
					console.log("[Webhook] Subscription price ID:", priceId);
					if (priceId) plan = getPlanFromPriceId(priceId) ?? undefined;
				}

				if (plan) {
					await applyPlanToOrg(orgId, plan, {
						stripeCustomerId: customerId ?? undefined,
						stripeSubscriptionId: subscriptionId,
					});
				} else {
					console.warn("[Webhook] Could not determine plan for checkout session");
				}

				break;
			}

			case "customer.subscription.updated": {
				const subscription = event.data.object as Stripe.Subscription;
				const orgId = subscription.metadata?.org_id;

				console.log("[Webhook] customer.subscription.updated metadata:", {
					org_id: orgId,
					priceId: subscription.items.data[0]?.price.id,
				});

				if (!orgId) {
					console.warn("[Webhook] No org_id in subscription metadata, skipping");
					break;
				}

				const priceId = subscription.items.data[0]?.price.id;
				if (!priceId) break;

				const plan = getPlanFromPriceId(priceId);
				if (!plan) {
					console.warn(`[Webhook] Unknown price ID: ${priceId}`);
					break;
				}

				await applyPlanToOrg(orgId, plan);
				break;
			}

			case "customer.subscription.deleted": {
				const subscription = event.data.object as Stripe.Subscription;
				const orgId = subscription.metadata?.org_id;

				console.log("[Webhook] customer.subscription.deleted:", { org_id: orgId });

				if (!orgId) break;

				await applyPlanToOrg(orgId, "free", { stripeSubscriptionId: null });
				break;
			}

			default:
				console.log(`[Webhook] Unhandled event type: ${event.type}`);
				break;
		}

		return NextResponse.json({ received: true });
	} catch (err) {
		console.error("[Webhook] Unhandled error:", err);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
