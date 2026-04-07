import Anthropic from "@anthropic-ai/sdk";

export interface WebsiteDiffSummary {
	/** One-line human-readable summary of what changed */
	headline: string;
	/** Key specific changes detected */
	changes: string[];
	/** Sales implication — what this means competitively */
	salesImplication: string;
}

const SUMMARIZE_PROMPT = `You are a competitive intelligence analyst for cybersecurity SaaS companies.

A competitor's web page has changed. Analyze the before/after content and produce a structured summary.

## Page: {path}
## Page title: {title}

### Before
{before}

### After
{after}

## Instructions

Return a JSON object (no markdown fences) with exactly these fields:

{
  "headline": "<one-line summary of the most important change, max 120 chars>",
  "changes": ["<specific change 1>", "<specific change 2>"],
  "salesImplication": "<what this means for our sales team — one sentence>"
}

Rules:
- headline: Focus on WHAT changed and WHY it matters, not just "page updated". Be specific. Example: "Added new Enterprise tier at $499/mo with SSO and SCIM"
- changes: 2-4 bullet points of specific, concrete changes. Reference actual content differences.
- salesImplication: Actionable for sales. Example: "They're moving upmarket — emphasize our mid-market value in competitive deals"
- If the change is trivial (typo fixes, minor rewording), set headline to "Minor copy updates on {path}" and salesImplication to "No competitive impact"
- Return ONLY valid JSON.`;

function buildPrompt(path: string, title: string, before: string, after: string): string {
	return SUMMARIZE_PROMPT.replace("{path}", path)
		.replace("{title}", title)
		.replace("{before}", before.slice(0, 3000))
		.replace("{after}", after.slice(0, 3000));
}

function parseResponse(text: string): WebsiteDiffSummary {
	const cleaned = text
		.replace(/```json\s*/g, "")
		.replace(/```\s*/g, "")
		.trim();
	const parsed = JSON.parse(cleaned) as {
		headline?: string;
		changes?: string[];
		salesImplication?: string;
	};

	return {
		headline: parsed.headline ?? "Page content updated",
		changes: Array.isArray(parsed.changes) ? parsed.changes.slice(0, 5) : [],
		salesImplication: parsed.salesImplication ?? "",
	};
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
	if (!client) client = new Anthropic();
	return client;
}

export async function summarizeWebsiteDiff(
	path: string,
	title: string,
	before: string,
	after: string,
): Promise<WebsiteDiffSummary> {
	const prompt = buildPrompt(path, title, before, after);

	try {
		const response = await getClient().messages.create({
			model: "claude-haiku-4-5-20251001",
			max_tokens: 512,
			messages: [{ role: "user", content: prompt }],
		});

		const block = response.content[0];
		if (!block || block.type !== "text") {
			return fallbackSummary(path);
		}

		return parseResponse(block.text);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.warn(`[Summarizer] Failed for ${path}: ${message}`);
		return fallbackSummary(path);
	}
}

function fallbackSummary(path: string): WebsiteDiffSummary {
	return {
		headline: `Content changed on ${path}`,
		changes: [],
		salesImplication: "",
	};
}
