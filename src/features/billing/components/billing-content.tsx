"use client";

import { PlanCard } from "@/features/billing/components/plan-card";
import { PLANS, PLAN_ORDER } from "@/lib/stripe";
import type { BillingInterval, PlanId } from "@/lib/stripe";
import { useState } from "react";

interface BillingContentProps {
	orgId: string;
	currentPlan: PlanId;
	hasStripeCustomer: boolean;
	success: boolean;
	canceled: boolean;
}

export function BillingContent({
	orgId,
	currentPlan,
	hasStripeCustomer,
	success,
	canceled,
}: BillingContentProps) {
	const [interval, setInterval] = useState<BillingInterval>("monthly");
	const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
	const [loadingPortal, setLoadingPortal] = useState(false);

	const currentPlanInfo = PLANS[currentPlan];

	async function handleCheckout(plan: PlanId) {
		setLoadingPlan(plan);
		try {
			const res = await fetch("/api/stripe/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orgId, plan, interval }),
			});
			const data: { url?: string } = await res.json();
			if (data.url) {
				window.location.href = data.url;
			}
		} finally {
			setLoadingPlan(null);
		}
	}

	async function handlePortal() {
		setLoadingPortal(true);
		try {
			const res = await fetch("/api/stripe/portal", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orgId }),
			});
			const data: { url?: string } = await res.json();
			if (data.url) {
				window.location.href = data.url;
			}
		} finally {
			setLoadingPortal(false);
		}
	}

	const currentIndex = PLAN_ORDER.indexOf(currentPlan);

	return (
		<div className="space-y-6">
			{success && (
				<div className="rounded-[3px] bg-success-bg px-4 py-3 text-sm font-medium text-success-text">
					Subscription activated! Your plan has been updated.
				</div>
			)}

			{canceled && (
				<div className="rounded-[3px] bg-warning-bg px-4 py-3 text-sm font-medium text-text-primary">
					Checkout was canceled. No changes were made to your subscription.
				</div>
			)}

			<div className="rounded-[3px] border border-border bg-white p-4">
				<p className="text-sm text-text-secondary">Current plan</p>
				<p className="text-lg font-semibold text-text-primary">{currentPlanInfo?.name ?? "Free"}</p>
			</div>

			<div className="flex items-center justify-center gap-2">
				<button
					type="button"
					onClick={() => setInterval("monthly")}
					className={`cursor-pointer rounded-[3px] px-4 py-2 text-sm font-medium ${
						interval === "monthly"
							? "bg-brand text-white"
							: "border border-border bg-white text-text-secondary hover:bg-surface-hover"
					}`}
				>
					Monthly
				</button>
				<button
					type="button"
					onClick={() => setInterval("yearly")}
					className={`cursor-pointer rounded-[3px] px-4 py-2 text-sm font-medium ${
						interval === "yearly"
							? "bg-brand text-white"
							: "border border-border bg-white text-text-secondary hover:bg-surface-hover"
					}`}
				>
					Yearly
					<span className="ml-1 text-xs opacity-75">Save ~17%</span>
				</button>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{PLAN_ORDER.map((planId) => {
					const plan = PLANS[planId];
					if (!plan) return null;
					const isCurrent = currentPlan === planId;
					const targetIndex = PLAN_ORDER.indexOf(planId);
					const isUpgrade = targetIndex > currentIndex;

					return (
						<PlanCard
							key={planId}
							plan={plan}
							interval={interval}
							isCurrentPlan={isCurrent}
							actionLabel={
								isCurrent
									? "Current Plan"
									: planId === "free"
										? "Free"
										: isUpgrade
											? `Upgrade to ${plan.name}`
											: `Switch to ${plan.name}`
							}
							onSelect={!isCurrent && planId !== "free" ? () => handleCheckout(planId) : undefined}
							loading={loadingPlan === planId}
							disabled={loadingPlan !== null}
						/>
					);
				})}
			</div>

			{hasStripeCustomer && (
				<button
					type="button"
					onClick={handlePortal}
					disabled={loadingPortal}
					className="cursor-pointer rounded-[3px] border border-border bg-white px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover disabled:opacity-50"
				>
					{loadingPortal ? "Redirecting..." : "Manage Subscription"}
				</button>
			)}
		</div>
	);
}
