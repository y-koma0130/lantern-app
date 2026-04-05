import { supabase } from "../shared/db.js";
import type { DeliveryLog, Digest } from "../shared/types.js";

export async function fetchPendingDigests(orgId: string): Promise<Digest[]> {
	// Fetch digests that have no successful delivery log
	const { data, error } = await supabase
		.from("digests")
		.select("*, delivery_logs!left(status)")
		.eq("org_id", orgId)
		.or("delivery_logs.status.is.null,delivery_logs.status.neq.sent")
		.order("generated_at", { ascending: false });

	if (error) {
		throw new Error(`Failed to fetch pending digests: ${error.message}`);
	}

	return (data ?? []) as Digest[];
}

export async function saveDeliveryLog(input: {
	orgId: string;
	digestId: string;
	channel: DeliveryLog["channel"];
	status: DeliveryLog["status"];
}): Promise<void> {
	const { error } = await supabase.from("delivery_logs").insert({
		org_id: input.orgId,
		digest_id: input.digestId,
		channel: input.channel,
		status: input.status,
		attempted_at: new Date().toISOString(),
	});

	if (error) {
		throw new Error(`Failed to save delivery log: ${error.message}`);
	}
}
