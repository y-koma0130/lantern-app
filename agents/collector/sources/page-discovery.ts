import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import { fetchRenderedHtml } from "../../shared/browser.js";
import type { Competitor } from "../../shared/types.js";

export interface DiscoveredPages {
	/** e.g. { pricing: "/plans-and-pricing", features: "/product", solutions: "/solutions" } */
	pages: Record<string, string>;
}

const CLASSIFY_PROMPT = `You are analyzing a cybersecurity SaaS company's website navigation.

## Company: {name}
## Homepage URL: {url}

## Links found on the page
{links}

## Instructions

From the links above, identify which ones correspond to these page categories:
- **pricing**: pricing, plans, packages page
- **features**: features, product, platform, capabilities page
- **solutions**: solutions, use-cases page
- **about**: about, company, team page
- **blog**: blog, resources, news page
- **docs**: documentation, developers, API page

Return a JSON object (no markdown fences) mapping category names to their relative paths.
Only include categories where you found a clear match. Do not guess or fabricate URLs.

Example output:
{"pricing": "/pricing", "features": "/product/platform", "solutions": "/solutions", "blog": "/blog"}

Rules:
- Use relative paths (starting with /)
- Only include paths that actually appeared in the links list
- If a category has multiple candidates, pick the most specific one
- Return ONLY valid JSON`;

let client: Anthropic | null = null;
function getClient(): Anthropic {
	if (!client) client = new Anthropic();
	return client;
}

function extractNavLinks(html: string, baseUrl: string): { text: string; href: string }[] {
	const $ = cheerio.load(html);
	const origin = new URL(baseUrl).origin;
	const links: { text: string; href: string }[] = [];
	const seen = new Set<string>();

	// Focus on navigation and header links
	$("nav a, header a, [role='navigation'] a, [class*='nav'] a, [class*='menu'] a").each(
		(_i, el) => {
			const $el = $(el);
			const href = $el.attr("href");
			if (!href) return;

			// Resolve relative URLs
			let resolved: string;
			try {
				resolved = new URL(href, origin).href;
			} catch {
				return;
			}

			// Only same-origin links
			if (!resolved.startsWith(origin)) return;

			const path = new URL(resolved).pathname;
			if (/\.(js|css|png|jpg|svg|pdf)$/i.test(path)) return;
			if (/\/(login|signup|register|auth|callback)/i.test(path)) return;

			if (seen.has(path)) return;
			seen.add(path);

			const text = $el.text().trim().slice(0, 80);
			if (text) {
				links.push({ text, href: path });
			}
		},
	);

	return links;
}

export async function discoverPages(competitor: Competitor): Promise<DiscoveredPages> {
	console.log(`[Discovery] Discovering pages for ${competitor.name}: ${competitor.website}`);

	const html = await fetchRenderedHtml(competitor.website);
	if (!html) {
		console.warn(`[Discovery] Failed to fetch homepage for ${competitor.name}`);
		return { pages: {} };
	}

	const links = extractNavLinks(html, competitor.website);
	if (links.length === 0) {
		console.warn(`[Discovery] No nav links found for ${competitor.name}`);
		return { pages: {} };
	}

	const linksStr = links.map((l) => `${l.href} — "${l.text}"`).join("\n");

	const prompt = CLASSIFY_PROMPT.replace("{name}", competitor.name)
		.replace("{url}", competitor.website)
		.replace("{links}", linksStr);

	try {
		const response = await getClient().messages.create({
			model: "claude-haiku-4-5-20251001",
			max_tokens: 512,
			messages: [{ role: "user", content: prompt }],
		});

		const block = response.content[0];
		if (!block || block.type !== "text") {
			return { pages: {} };
		}

		const cleaned = block.text
			.replace(/```json\s*/g, "")
			.replace(/```\s*/g, "")
			.trim();
		const parsed = JSON.parse(cleaned) as Record<string, string>;

		// Validate: only keep entries with string values starting with /
		const pages: Record<string, string> = {};
		for (const [category, path] of Object.entries(parsed)) {
			if (typeof path === "string" && path.startsWith("/")) {
				pages[category] = path;
			}
		}

		console.log(
			`[Discovery] ${competitor.name}: ${Object.entries(pages)
				.map(([k, v]) => `${k}=${v}`)
				.join(", ")}`,
		);
		return { pages };
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.warn(`[Discovery] LLM classification failed for ${competitor.name}: ${message}`);
		return { pages: {} };
	}
}
