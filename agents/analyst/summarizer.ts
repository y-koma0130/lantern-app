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

/* ---------- Baseline page summary ---------- */

export interface BaselinePageSummary {
	/** One-line description of what this page communicates */
	headline: string;
	/** Key positioning points or notable details */
	keyPoints: string[];
	/** Competitive takeaway */
	competitiveTakeaway: string;
}

const BASELINE_PROMPT = `You are a competitive intelligence analyst for cybersecurity SaaS companies.

Summarize the following competitor web page for a sales team. Extract what matters competitively.

## Competitor: {competitor}
## Page: {path}
## Page title: {title}

### Content
{content}

## Instructions

Return a JSON object (no markdown fences) with exactly these fields:

{
  "headline": "<one-line summary of what this page communicates, max 120 chars>",
  "keyPoints": ["<notable competitive detail 1>", "<notable competitive detail 2>"],
  "competitiveTakeaway": "<one sentence: what this means for our positioning>"
}

Rules:
- headline: Describe the page's PURPOSE and KEY MESSAGE, not just "pricing page". Example: "4 tiers from Free to Enterprise ($499/mo), SSO only on Enterprise"
- keyPoints: 2-4 specific, concrete details. Pricing tiers, key feature claims, target audience, differentiators.
- competitiveTakeaway: What our sales team should know. Example: "They don't offer a free tier — opportunity to win budget-conscious prospects"
- Return ONLY valid JSON.`;

export async function summarizeBaselinePage(
	competitorName: string,
	path: string,
	title: string,
	content: string,
): Promise<BaselinePageSummary> {
	const prompt = BASELINE_PROMPT.replace("{competitor}", competitorName)
		.replace("{path}", path)
		.replace("{title}", title)
		.replace("{content}", content.slice(0, 4000));

	try {
		const response = await getClient().messages.create({
			model: "claude-haiku-4-5-20251001",
			max_tokens: 512,
			messages: [{ role: "user", content: prompt }],
		});

		const block = response.content[0];
		if (!block || block.type !== "text") {
			return { headline: title, keyPoints: [], competitiveTakeaway: "" };
		}

		const cleaned = block.text
			.replace(/```json\s*/g, "")
			.replace(/```\s*/g, "")
			.trim();
		const parsed = JSON.parse(cleaned) as {
			headline?: string;
			keyPoints?: string[];
			competitiveTakeaway?: string;
		};

		return {
			headline: parsed.headline ?? title,
			keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 5) : [],
			competitiveTakeaway: parsed.competitiveTakeaway ?? "",
		};
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.warn(`[Summarizer] Baseline failed for ${path}: ${message}`);
		return { headline: title, keyPoints: [], competitiveTakeaway: "" };
	}
}
