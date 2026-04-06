import { canUseSlackDiscord } from "../../src/lib/plan-limits.js";
import { fetchOrgMembers } from "../shared/org-repository.js";
import type { Organization } from "../shared/types.js";
import { sendDiscordMessage } from "./discord.js";
import { sendEmail } from "./email.js";
import { fetchPendingDigests, saveDeliveryLog } from "./repository.js";
import { sendSlackMessage } from "./slack.js";

export async function runDelivery(org: Organization): Promise<void> {
	console.log("[Delivery] Starting...");

	const digests = await fetchPendingDigests(org.id);
	const slackDiscordEnabled = canUseSlackDiscord(org.plan);

	for (const digest of digests) {
		// Email delivery (all plans)
		if (org.channelEmail) {
			const members = await fetchOrgMembers(org.id);

			for (const member of members) {
				await deliverToChannel(org.id, digest.id, "email", async () => {
					await sendEmail({
						to: member.email,
						subject: `Lantern Weekly Intelligence Digest — ${digest.weekOf}`,
						html: digest.contentHtml,
					});
				});
			}
		}

		// Slack delivery (Starter+)
		if (org.channelSlack && slackDiscordEnabled) {
			await deliverToChannel(org.id, digest.id, "slack", async () => {
				await sendSlackMessage({
					webhookUrl: org.channelSlack as string,
					orgName: org.name,
					weekOf: digest.weekOf,
					markdown: digest.contentMd,
				});
			});
		}

		// Discord delivery (Starter+)
		if (org.channelDiscord && slackDiscordEnabled) {
			await deliverToChannel(org.id, digest.id, "discord", async () => {
				await sendDiscordMessage({
					webhookUrl: org.channelDiscord as string,
					orgName: org.name,
					weekOf: digest.weekOf,
					markdown: digest.contentMd,
				});
			});
		}
	}

	console.log("[Delivery] Done.");
}

async function deliverToChannel(
	orgId: string,
	digestId: string,
	channel: "email" | "slack" | "discord",
	sendFn: () => Promise<void>,
): Promise<void> {
	try {
		await sendFn();
		await saveDeliveryLog({ orgId, digestId, channel, status: "sent" });
	} catch (error) {
		console.error(`[Delivery] Failed ${channel}:`, error);
		try {
			await saveDeliveryLog({ orgId, digestId, channel, status: "failed" });
		} catch (logError) {
			console.error("[Delivery] Failed to save delivery log:", logError);
		}
	}
}
