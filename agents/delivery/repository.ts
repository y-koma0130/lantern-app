import { supabase } from "../shared/db.js";
import type { DeliveryLog, Digest } from "../shared/types.js";

export async function fetchPendingDigests(orgId: string): Promise<Digest[]> {
	// Get IDs of digests that have already been successfully delivered
	const { data: sentLogs } = await supabase
		.from("delivery_logs")
		.select("digest_id")
		.eq("org_id", orgId)
		.eq("status", "sent");

	const sentDigestIds = (sentLogs ?? []).map((l) => l.digest_id);

	// Fetch digests excluding already-delivered ones
	let query = supabase
		.from("digests")
		.select("*")
		.eq("org_id", orgId)
		.order("generated_at", { ascending: false });

	if (sentDigestIds.length > 0) {
		query = query.not("id", "in", `(${sentDigestIds.map((id) => `"${id}"`).join(",")})`);
	}

	const { data, error } = await query;

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
