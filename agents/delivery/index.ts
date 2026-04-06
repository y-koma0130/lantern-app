import { canUseSlackDiscord } from "../../src/lib/plan-limits.js";
import { fetchOrgMembers } from "../shared/org-repository.js";
import type { Organization } from "../shared/types.js";
import { sendEmail } from "./email.js";
import { fetchPendingDigests, saveDeliveryLog } from "./repository.js";

export async function runDelivery(org: Organization): Promise<void> {
	console.log("[Delivery] Starting...");

	const slackDiscordEnabled = canUseSlackDiscord(org.plan);

	if (org.channelSlack && !slackDiscordEnabled) {
		console.log(`[Delivery] Skipping Slack for org ${org.name} (plan: ${org.plan})`);
	}

	if (org.channelDiscord && !slackDiscordEnabled) {
		console.log(`[Delivery] Skipping Discord for org ${org.name} (plan: ${org.plan})`);
	}

	const digests = await fetchPendingDigests(org.id);

	for (const digest of digests) {
		if (org.channelEmail) {
			const members = await fetchOrgMembers(org.id);

			for (const member of members) {
				try {
					await sendEmail({
						to: member.email,
						subject: `Lantern Weekly Intelligence Digest — ${digest.weekOf}`,
						html: digest.contentHtml,
					});

					await saveDeliveryLog({
						orgId: org.id,
						digestId: digest.id,
						channel: "email",
						status: "sent",
					});
				} catch (error) {
					console.error(`[Delivery] Failed to send email to ${member.email}:`, error);

					try {
						await saveDeliveryLog({
							orgId: org.id,
							digestId: digest.id,
							channel: "email",
							status: "failed",
						});
					} catch (logError) {
						console.error("[Delivery] Failed to save delivery log:", logError);
					}
				}
			}
		}
	}

	console.log("[Delivery] Done.");
}
