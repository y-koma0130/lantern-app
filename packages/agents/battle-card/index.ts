import Anthropic from "@anthropic-ai/sdk";
import { formatDigest } from "./formatter.js";
import { buildPrompt } from "./prompt.js";
import { fetchInsightsForDigest, fetchSubscribers, saveDigest } from "./repository.js";

export async function runBattleCardGenerator(): Promise<void> {
	console.log("[Battle-card] Starting...");

	const client = new Anthropic();
	const subscribers = await fetchSubscribers();

	for (const subscriber of subscribers) {
		try {
			const insights = await fetchInsightsForDigest(subscriber.competitorIds);

			if (insights.length === 0) {
				continue;
			}

			const prompt = buildPrompt(insights);

			const response = await client.messages.create({
				model: "claude-sonnet-4-20250514",
				max_tokens: 4096,
				messages: [{ role: "user", content: prompt }],
			});

			const contentBlock = response.content[0];
			if (!contentBlock || contentBlock.type !== "text") {
				console.warn(`[Battle-card] Empty or non-text response for subscriber ${subscriber.id}`);
				continue;
			}

			const { markdown, html } = formatDigest(contentBlock.text);

			await saveDigest({
				subscriberId: subscriber.id,
				contentMd: markdown,
				contentHtml: html,
			});
		} catch (error) {
			console.error(`[Battle-card] Failed for subscriber ${subscriber.id}:`, error);
		}
	}

	console.log("[Battle-card] Done.");
}
