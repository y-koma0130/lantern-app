import { DeliverySettingsForm } from "@/features/settings/components/delivery-settings-form";
import { UPGRADE_MESSAGES, canUseSlackDiscord } from "@/lib/plan-limits";
import { getOrgContext } from "@/lib/queries/get-org-context";
import { createAdminClient } from "@/lib/supabase/admin";

interface DeliveryPageProps {
	orgSlug: string;
}

export async function DeliveryPage({ orgSlug }: DeliveryPageProps) {
	const { orgId, orgPlan, isOwner } = await getOrgContext(orgSlug);

	const supabase = createAdminClient();
	const { data: org } = await supabase
		.from("organizations")
		.select("id, channel_email, channel_slack, channel_discord, digest_frequency")
		.eq("id", orgId)
		.single();

	return (
		<DeliverySettingsForm
			orgId={orgId}
			initialChannelEmail={org?.channel_email ?? false}
			initialChannelSlack={org?.channel_slack ?? null}
			initialChannelDiscord={org?.channel_discord ?? null}
			initialDigestFrequency={org?.digest_frequency ?? "weekly"}
			isOwner={isOwner}
			canSlackDiscord={canUseSlackDiscord(orgPlan)}
			slackDiscordUpgradeMessage={UPGRADE_MESSAGES.slackDiscord ?? ""}
		/>
	);
}
