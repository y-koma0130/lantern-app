import { BillingActions } from "@/features/billing/components/billing-actions";
import { PlanCard } from "@/features/billing/components/plan-card";
import { getOrgContext } from "@/lib/queries/get-org-context";
import { PLANS, PLAN_ORDER } from "@/lib/stripe";
import type { PlanId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

interface BillingPageProps {
	orgSlug: string;
	success: boolean;
	canceled: boolean;
}

export async function BillingPage({ orgSlug, success, canceled }: BillingPageProps) {
	const { orgId } = await getOrgContext(orgSlug);

	const supabase = createAdminClient();
	const { data: org } = await supabase
		.from("organizations")
		.select("plan, stripe_customer_id")
		.eq("id", orgId)
		.single();

	const currentPlan = (org?.plan ?? "free") as PlanId;
	const hasStripeCustomer = Boolean(org?.stripe_customer_id);
	const currentPlanInfo = PLANS[currentPlan];

	return (
		<div className="space-y-6">
			{success && (
				<div className="rounded-[3px] bg-[#E3FCEF] px-4 py-3 text-sm font-medium text-[#006644]">
					Subscription activated! Your plan has been updated.
				</div>
			)}

			{canceled && (
				<div className="rounded-[3px] bg-[#FFFAE6] px-4 py-3 text-sm font-medium text-[#172B4D]">
					Checkout was canceled. No changes were made to your subscription.
				</div>
			)}

			<div className="rounded-[3px] border border-[#DFE1E6] bg-white p-4">
				<p className="text-sm text-[#505F79]">Current plan</p>
				<p className="text-lg font-semibold text-[#172B4D]">
					{currentPlanInfo.name}{" "}
					<span className="text-sm font-normal text-[#505F79]">
						— ${currentPlanInfo.price}/month
					</span>
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{PLAN_ORDER.map((planId) => {
					const plan = PLANS[planId];
					return (
						<PlanCard
							key={planId}
							planId={planId}
							name={plan.name}
							price={plan.price}
							competitors={plan.competitorsLabel}
							members={plan.membersLabel}
							frequency={plan.frequencyLabel}
							isCurrentPlan={currentPlan === planId}
						/>
					);
				})}
			</div>

			<BillingActions
				orgId={orgId}
				currentPlan={currentPlan}
				hasStripeCustomer={hasStripeCustomer}
			/>
		</div>
	);
}
