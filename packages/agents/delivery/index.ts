import { sendEmail } from "./email.js";
import { fetchPendingDigests, fetchSubscribersByIds, saveDeliveryLog } from "./repository.js";

export async function runDelivery(): Promise<void> {
	console.log("[Delivery] Starting...");

	const digests = await fetchPendingDigests();
	const subscriberIds = [...new Set(digests.map((d) => d.subscriberId))];
	const subscriberMap = await fetchSubscribersByIds(subscriberIds);

	for (const digest of digests) {
		const subscriber = subscriberMap.get(digest.subscriberId);

		if (!subscriber) {
			console.warn(`[Delivery] Subscriber not found: ${digest.subscriberId}`);
			continue;
		}

		if (subscriber.channelEmail) {
			try {
				await sendEmail({
					to: subscriber.email,
					subject: `Lantern Weekly Intelligence Digest — ${digest.weekOf}`,
					html: digest.contentHtml,
				});

				await saveDeliveryLog({
					digestId: digest.id,
					channel: "email",
					status: "sent",
				});
			} catch (error) {
				console.error(`[Delivery] Failed to send email to ${subscriber.email}:`, error);

				try {
					await saveDeliveryLog({
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

	console.log("[Delivery] Done.");
}
