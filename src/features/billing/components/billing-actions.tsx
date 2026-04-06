"use client";

import { PLANS, PLAN_ORDER } from "@/lib/stripe";
import type { PlanId } from "@/lib/stripe";
import { useState } from "react";

interface BillingActionsProps {
	orgId: string;
	currentPlan: PlanId;
	hasStripeCustomer: boolean;
}

const PAID_PLANS: PlanId[] = ["starter", "pro", "team"];

export function BillingActions({ orgId, currentPlan, hasStripeCustomer }: BillingActionsProps) {
	const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
	const [loadingPortal, setLoadingPortal] = useState(false);

	async function handleCheckout(plan: PlanId) {
		setLoadingPlan(plan);
		try {
			const res = await fetch("/api/stripe/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orgId, plan }),
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
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
				<div className="flex items-center justify-center rounded-[3px] border border-[#DFE1E6] px-4 py-2 text-sm text-[#505F79]">
					{currentPlan === "free" ? "Current Plan" : "Free"}
				</div>

				{PAID_PLANS.map((planId) => {
					const plan = PLANS[planId];
					const isCurrent = currentPlan === planId;

					if (isCurrent) {
						return (
							<div
								key={planId}
								className="flex items-center justify-center rounded-[3px] border-2 border-[#0052CC] px-4 py-2 text-sm font-medium text-[#0052CC]"
							>
								Current Plan
							</div>
						);
					}

					const targetIndex = PLAN_ORDER.indexOf(planId);
					const isUpgrade = targetIndex > currentIndex;
					const label = isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`;

					return (
						<button
							key={planId}
							type="button"
							onClick={() => handleCheckout(planId)}
							disabled={loadingPlan !== null}
							className="cursor-pointer rounded-[3px] bg-[#0052CC] px-4 py-2 text-sm font-medium text-white hover:bg-[#0747A6] disabled:opacity-50"
						>
							{loadingPlan === planId ? "Redirecting..." : label}
						</button>
					);
				})}
			</div>

			{hasStripeCustomer && (
				<button
					type="button"
					onClick={handlePortal}
					disabled={loadingPortal}
					className="cursor-pointer rounded-[3px] border border-[#DFE1E6] bg-white px-4 py-2 text-sm font-medium text-[#172B4D] hover:bg-[#F4F5F7] disabled:opacity-50"
				>
					{loadingPortal ? "Redirecting..." : "Manage Subscription"}
				</button>
			)}
		</div>
	);
}
