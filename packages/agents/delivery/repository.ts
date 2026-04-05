import { supabase } from "../shared/db.js";
import type { DeliveryLog, Digest, Subscriber } from "../shared/types.js";

export async function fetchPendingDigests(): Promise<Digest[]> {
	// Fetch digests that have no successful delivery log
	const { data, error } = await supabase
		.from("digests")
		.select("*, delivery_logs!left(status)")
		.or("delivery_logs.status.is.null,delivery_logs.status.neq.sent")
		.order("generated_at", { ascending: false });

	if (error) {
		throw new Error(`Failed to fetch pending digests: ${error.message}`);
	}

	return (data ?? []) as Digest[];
}

export async function fetchSubscribersByIds(ids: string[]): Promise<Map<string, Subscriber>> {
	if (ids.length === 0) return new Map();

	const { data, error } = await supabase.from("subscribers").select("*").in("id", ids);

	if (error) {
		throw new Error(`Failed to fetch subscribers: ${error.message}`);
	}

	const map = new Map<string, Subscriber>();
	for (const subscriber of (data ?? []) as Subscriber[]) {
		map.set(subscriber.id, subscriber);
	}
	return map;
}

export async function saveDeliveryLog(input: {
	digestId: string;
	channel: DeliveryLog["channel"];
	status: DeliveryLog["status"];
}): Promise<void> {
	const { error } = await supabase.from("delivery_logs").insert({
		digest_id: input.digestId,
		channel: input.channel,
		status: input.status,
		attempted_at: new Date().toISOString(),
	});

	if (error) {
		throw new Error(`Failed to save delivery log: ${error.message}`);
	}
}
