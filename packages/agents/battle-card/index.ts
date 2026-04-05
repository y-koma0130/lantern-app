import Anthropic from "@anthropic-ai/sdk";
import type { Organization } from "../shared/types.js";
import { formatDigest } from "./formatter.js";
import { buildPrompt } from "./prompt.js";
import { fetchInsightsForDigest, saveDigest } from "./repository.js";

export async function runBattleCardGenerator(org: Organization): Promise<void> {
	console.log("[Battle-card] Starting...");

	const client = new Anthropic();

	try {
		const insights = await fetchInsightsForDigest(org.id);

		if (insights.length === 0) {
			console.log("[Battle-card] No insights found, skipping.");
			return;
		}

		const prompt = buildPrompt(insights);

		const response = await client.messages.create({
			model: "claude-sonnet-4-20250514",
			max_tokens: 4096,
			messages: [{ role: "user", content: prompt }],
		});

		const contentBlock = response.content[0];
		if (!contentBlock || contentBlock.type !== "text") {
			console.warn(`[Battle-card] Empty or non-text response for org ${org.id}`);
			return;
		}

		const { markdown, html } = formatDigest(contentBlock.text);

		await saveDigest({
			orgId: org.id,
			contentMd: markdown,
			contentHtml: html,
		});
	} catch (error) {
		console.error(`[Battle-card] Failed for org ${org.id}:`, error);
	}

	console.log("[Battle-card] Done.");
}
