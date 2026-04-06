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

export type BillingInterval = "monthly" | "yearly";

export interface PlanFeatures {
	name: string;
	monthlyPrice: number;
	yearlyPrice: number;
	competitors: number;
	members: number;
	frequency: string;
	emailDelivery: boolean;
	slackDiscord: boolean;
	battleCards: boolean;
	csvExport: boolean;
	archiveDays: number | null;
	support: string;
}

export const PLANS: Record<string, PlanFeatures> = {
	free: {
		name: "Free",
		monthlyPrice: 0,
		yearlyPrice: 0,
		competitors: 3,
		members: 1,
		frequency: "monthly",
		emailDelivery: true,
		slackDiscord: false,
		battleCards: false,
		csvExport: false,
		archiveDays: 0,
		support: "Community",
	},
	starter: {
		name: "Starter",
		monthlyPrice: 79,
		yearlyPrice: 790,
		competitors: 10,
		members: 3,
		frequency: "weekly",
		emailDelivery: true,
		slackDiscord: true,
		battleCards: false,
		csvExport: false,
		archiveDays: 30,
		support: "Email",
	},
	pro: {
		name: "Pro",
		monthlyPrice: 199,
		yearlyPrice: 1990,
		competitors: 20,
		members: 10,
		frequency: "weekly",
		emailDelivery: true,
		slackDiscord: true,
		battleCards: true,
		csvExport: true,
		archiveDays: 90,
		support: "Priority email",
	},
	team: {
		name: "Team",
		monthlyPrice: 399,
		yearlyPrice: 3990,
		competitors: 50,
		members: 25,
		frequency: "weekly",
		emailDelivery: true,
		slackDiscord: true,
		battleCards: true,
		csvExport: true,
		archiveDays: null,
		support: "Priority email",
	},
} as const;

export type PlanId = "free" | "starter" | "pro" | "team";

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "team"];

export function getStripePriceId(plan: PlanId, interval: BillingInterval): string | null {
	const priceIds: Record<PlanId, Record<BillingInterval, string | undefined>> = {
		free: { monthly: undefined, yearly: undefined },
		starter: {
			monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
			yearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
		},
		pro: {
			monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
			yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
		},
		team: {
			monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY,
			yearly: process.env.STRIPE_PRICE_TEAM_YEARLY,
		},
	};
	return priceIds[plan]?.[interval] ?? null;
}

export function getPlanFromPriceId(priceId: string): PlanId | null {
	const allPriceEnvs: { env: string; plan: PlanId }[] = [
		{ env: "STRIPE_PRICE_STARTER_MONTHLY", plan: "starter" },
		{ env: "STRIPE_PRICE_STARTER_YEARLY", plan: "starter" },
		{ env: "STRIPE_PRICE_PRO_MONTHLY", plan: "pro" },
		{ env: "STRIPE_PRICE_PRO_YEARLY", plan: "pro" },
		{ env: "STRIPE_PRICE_TEAM_MONTHLY", plan: "team" },
		{ env: "STRIPE_PRICE_TEAM_YEARLY", plan: "team" },
	];

	for (const { env, plan } of allPriceEnvs) {
		if (process.env[env] === priceId) return plan;
	}

	return null;
}

export function getAppUrl(): string {
	return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
