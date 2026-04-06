import { BillingContent } from "@/features/billing/components/billing-content";
import { getOrgContext } from "@/lib/queries/get-org-context";
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

	return (
		<BillingContent
			orgId={orgId}
			currentPlan={currentPlan}
			hasStripeCustomer={hasStripeCustomer}
			success={success}
			canceled={canceled}
		/>
	);
}
