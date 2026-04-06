import { PLANS } from "@/lib/stripe";
import type { PlanFeatures, PlanId } from "@/lib/stripe";

const FREE_PLAN = PLANS.free as PlanFeatures;

export function getPlanFeatures(plan: string): PlanFeatures {
	return PLANS[plan] ?? FREE_PLAN;
}

export function canUseSlackDiscord(plan: string): boolean {
	return getPlanFeatures(plan).slackDiscord;
}

export function canUseBattleCards(plan: string): boolean {
	return getPlanFeatures(plan).battleCards;
}

export function canUseCsvExport(plan: string): boolean {
	return getPlanFeatures(plan).csvExport;
}

export function canUseDailyAlerts(plan: string): boolean {
	const features = getPlanFeatures(plan);
	return features.battleCards; // Pro and Team have daily alerts
}

export function getArchiveDays(plan: string): number | null {
	return getPlanFeatures(plan).archiveDays;
}

export function getMaxCompetitors(plan: string): number {
	return getPlanFeatures(plan).competitors;
}

export function getMaxMembers(plan: string): number {
	return getPlanFeatures(plan).members;
}

export function isFeatureAvailable(plan: string, feature: keyof PlanFeatures): boolean {
	const value = getPlanFeatures(plan)[feature];
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value > 0;
	return value !== null;
}

export const UPGRADE_MESSAGES: Record<string, string> = {
	slackDiscord: "Upgrade to Starter or higher to use Slack and Discord notifications.",
	battleCards: "Upgrade to Pro or higher to generate battle cards.",
	csvExport: "Upgrade to Pro or higher to export data as CSV.",
	dailyAlerts: "Upgrade to Pro or higher to receive daily alerts.",
};
