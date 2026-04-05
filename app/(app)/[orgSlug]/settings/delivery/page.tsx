import { DeliverySettingsForm } from "@/features/settings/components/delivery-settings-form";
import { getOrgContext } from "@/lib/queries/get-org-context";
import { createClient } from "@/lib/supabase/server";

interface DeliveryPageProps {
	params: Promise<{ orgSlug: string }>;
}

export default async function DeliveryPage({ params }: DeliveryPageProps) {
	const { orgSlug } = await params;
	const { orgId, isOwner } = await getOrgContext(orgSlug);

	const supabase = await createClient();
	const { data: org } = await supabase
		.from("organizations")
		.select("id, channel_email, channel_slack, channel_discord, digest_frequency")
		.eq("id", orgId)
		.single();

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-[#172B4D]">Delivery Settings</h2>
				<p className="mt-1 text-sm text-[#505F79]">
					Configure how and when you receive competitive intelligence reports.
				</p>
			</div>

			<DeliverySettingsForm
				orgId={orgId}
				initialChannelEmail={org?.channel_email ?? false}
				initialChannelSlack={org?.channel_slack ?? null}
				initialChannelDiscord={org?.channel_discord ?? null}
				initialDigestFrequency={org?.digest_frequency ?? "weekly"}
				isOwner={isOwner}
			/>
		</div>
	);
}
