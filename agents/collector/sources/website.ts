import * as cheerio from "cheerio";
import { fetchRenderedHtml } from "../../shared/browser.js";
import { isErrorPage } from "../../shared/page-utils.js";
import type { Competitor } from "../../shared/types.js";

export interface PageData {
	title: string;
	metaDescription: string;
	headings: string[];
	bodyText: string;
}

export interface WebsiteCollectionResult {
	url: string;
	scrapedAt: string;
	pages: Record<string, PageData>;
}

const MAX_BODY_TEXT_LENGTH = 10_000;

function buildAbsoluteUrl(base: string, path: string): string {
	const origin = new URL(base).origin;
	return `${origin}${path}`;
}

function extractPageData(html: string): PageData {
	const $ = cheerio.load(html);

	$("nav, footer, script, style, noscript, header, aside").remove();

	const title = $("title").first().text().trim();
	const metaDescription = $('meta[name="description"]').attr("content")?.trim() ?? "";

	const headings: string[] = [];
	$("h1, h2, h3").each((_index, el) => {
		const text = $(el).text().trim();
		if (text) {
			headings.push(text);
		}
	});

	const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, MAX_BODY_TEXT_LENGTH);

	return { title, metaDescription, headings, bodyText };
}

/**
 * Build the list of pages to scrape.
 * Uses LLM-discovered pages when available, with "/" always included.
 */
function buildPageList(competitor: Competitor): { path: string; url: string }[] {
	const pages: { path: string; url: string }[] = [{ path: "/", url: competitor.website }];

	const discovered = competitor.discoveredPages ?? {};

	for (const [category, path] of Object.entries(discovered)) {
		if (path === "/") continue; // already included
		pages.push({
			path,
			url: buildAbsoluteUrl(competitor.website, path),
		});
	}

	return pages;
}

export async function collectWebsiteData(competitor: Competitor): Promise<WebsiteCollectionResult> {
	console.log(`[Collector] Crawling website for ${competitor.name}: ${competitor.website}`);

	const allUrls = buildPageList(competitor);

	const results = await Promise.allSettled(
		allUrls.map(async ({ path, url }) => {
			const html = await fetchRenderedHtml(url);
			if (!html) return null;
			const data = extractPageData(html);
			// Skip error pages
			if (path !== "/" && isErrorPage(data.title, data.bodyText)) {
				console.log(`[Collector] Skipping error page: ${url}`);
				return null;
			}
			return { path, data };
		}),
	);

	const pages: Record<string, PageData> = {};
	for (const result of results) {
		if (result.status === "fulfilled" && result.value) {
			pages[result.value.path] = result.value.data;
		}
	}

	return {
		url: competitor.website,
		scrapedAt: new Date().toISOString(),
		pages,
	};
}
