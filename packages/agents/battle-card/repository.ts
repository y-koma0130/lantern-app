import { INSIGHT_SCORE_THRESHOLD } from "../shared/constants.js";
import { getCurrentWeek } from "../shared/date.js";
import { supabase } from "../shared/db.js";
import type { Digest, Insight, Subscriber } from "../shared/types.js";

export async function fetchSubscribers(): Promise<Subscriber[]> {
	const { data, error } = await supabase.from("subscribers").select("*");

	if (error) {
		throw new Error(`Failed to fetch subscribers: ${error.message}`);
	}

	return (data ?? []) as Subscriber[];
}

export async function fetchInsightsForDigest(competitorIds: string[]): Promise<Insight[]> {
	const weekOf = getCurrentWeek();
	const { data, error } = await supabase
		.from("insights")
		.select("*")
		.in("competitor_id", competitorIds)
		.eq("week_of", weekOf)
		.gte("importance_score", INSIGHT_SCORE_THRESHOLD)
		.order("importance_score", { ascending: false });

	if (error) {
		throw new Error(`Failed to fetch insights: ${error.message}`);
	}

	return (data ?? []) as Insight[];
}

export async function saveDigest(input: {
	subscriberId: string;
	contentMd: string;
	contentHtml: string;
}): Promise<Digest> {
	const { data, error } = await supabase
		.from("digests")
		.insert({
			subscriber_id: input.subscriberId,
			week_of: getCurrentWeek(),
			content_md: input.contentMd,
			content_html: input.contentHtml,
			generated_at: new Date().toISOString(),
		})
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to save digest: ${error.message}`);
	}

	return data as Digest;
}
