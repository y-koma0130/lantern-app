import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
	if (!stripeClient) {
		const key = process.env.STRIPE_SECRET_KEY;
		if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
		stripeClient = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
	}
	return stripeClient;
}

export const PLANS = {
	free: {
		name: "Free",
		price: 0,
		competitors: 3,
		members: 1,
		frequency: "monthly",
		competitorsLabel: "3 competitors",
		membersLabel: "1 member",
		frequencyLabel: "Monthly digests",
	},
	starter: {
		name: "Starter",
		price: 99,
		competitors: 10,
		members: 3,
		frequency: "weekly",
		competitorsLabel: "10 competitors",
		membersLabel: "3 members",
		frequencyLabel: "Weekly digests",
	},
	pro: {
		name: "Pro",
		price: 249,
		competitors: 25,
		members: 10,
		frequency: "weekly",
		competitorsLabel: "25 competitors",
		membersLabel: "10 members",
		frequencyLabel: "Weekly + daily alerts",
	},
	team: {
		name: "Team",
		price: 499,
		competitors: 999,
		members: 999,
		frequency: "weekly",
		competitorsLabel: "Unlimited competitors",
		membersLabel: "Unlimited members",
		frequencyLabel: "Custom frequency",
	},
} as const;

export type PlanId = keyof typeof PLANS;

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "team"];

export function getStripePriceId(plan: PlanId): string | null {
	const priceIds: Record<PlanId, string | undefined> = {
		free: undefined,
		starter: process.env.STRIPE_PRICE_STARTER,
		pro: process.env.STRIPE_PRICE_PRO,
		team: process.env.STRIPE_PRICE_TEAM,
	};
	return priceIds[plan] ?? null;
}

export function getPlanFromPriceId(priceId: string): PlanId | null {
	const mapping: Record<string, PlanId> = {};
	const starterPrice = process.env.STRIPE_PRICE_STARTER;
	const proPrice = process.env.STRIPE_PRICE_PRO;
	const teamPrice = process.env.STRIPE_PRICE_TEAM;

	if (starterPrice) mapping[starterPrice] = "starter";
	if (proPrice) mapping[proPrice] = "pro";
	if (teamPrice) mapping[teamPrice] = "team";

	return mapping[priceId] ?? null;
}

export function getAppUrl(): string {
	return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
