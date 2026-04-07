import * as cheerio from "cheerio";
import { fetchRenderedHtml } from "../../shared/browser.js";
import type { Competitor } from "../../shared/types.js";

export interface FundingRound {
	date: string;
	roundName: string;
	amount: string | null;
	leadInvestors: string[];
}

export interface CrunchbaseData {
	competitorName: string;
	crunchbaseSlug: string;
	collectedAt: string;
	description: string | null;
	totalFunding: string | null;
	lastFundingRound: string | null;
	lastFundingDate: string | null;
	employeeRange: string | null;
	fundingRounds: FundingRound[];
	recentNews: { title: string; url: string; date: string }[];
}

const CRUNCHBASE_BASE = "https://www.crunchbase.com/organization";

export async function collectCrunchbaseData(competitor: Competitor): Promise<CrunchbaseData> {
	const slug = competitor.crunchbaseSlug ?? "";
	if (!slug) {
		console.warn(`[Crunchbase] No slug for ${competitor.name}, skipping`);
		return emptyCrunchbaseData(competitor.name, "");
	}

	const url = `${CRUNCHBASE_BASE}/${slug}`;
	console.log(`[Crunchbase] Fetching ${url}`);

	const html = await fetchRenderedHtml(url, {
		waitForSelector: "[class*='summary']",
	});

	if (!html) return emptyCrunchbaseData(competitor.name, slug);

	try {
		const $ = cheerio.load(html);

		const description = extractText($, [
			'[class*="description"]',
			'meta[name="description"]',
			'[class*="overview-description"]',
		]);

		const totalFunding = extractText($, [
			'[class*="total-funding"] span',
			'[class*="funding_total"]',
			'span:contains("Total Funding")',
		]);

		const lastFundingRound = extractText($, [
			'[class*="last-funding-type"]',
			'[class*="funding_round_last"]',
		]);

		const lastFundingDate = extractText($, [
			'[class*="last-funding-date"]',
			'[class*="funding_date_last"]',
		]);

		const employeeRange = extractText($, [
			'[class*="employee"] span',
			'[class*="num_employees"]',
			'span:contains("Employees")',
		]);

		const fundingRounds = extractFundingRounds($);
		const recentNews = extractRecentNews($);

		return {
			competitorName: competitor.name,
			crunchbaseSlug: slug,
			collectedAt: new Date().toISOString(),
			description,
			totalFunding,
			lastFundingRound,
			lastFundingDate,
			employeeRange,
			fundingRounds,
			recentNews,
		};
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.warn(`[Crunchbase] Failed to parse page for ${competitor.name}: ${message}`);
		return emptyCrunchbaseData(competitor.name, slug);
	}
}

function extractText($: cheerio.CheerioAPI, selectors: string[]): string | null {
	for (const sel of selectors) {
		const el = $(sel).first();
		if (el.length) {
			const content = el.attr("content") ?? el.text().trim();
			if (content) return content;
		}
	}
	return null;
}

function extractFundingRounds($: cheerio.CheerioAPI): FundingRound[] {
	const rounds: FundingRound[] = [];
	const rows = $(
		'[class*="funding-round"], [class*="funding_rounds"] tr, [class*="funding"] table tr',
	);

	rows.slice(0, 10).each((_i, el) => {
		const $el = $(el);
		const cells = $el.find("td, span, [class*='cell']");
		if (cells.length < 2) return;

		const texts = cells
			.map((_j, cell) => $(cell).text().trim())
			.get()
			.filter(Boolean);

		if (texts.length >= 2) {
			rounds.push({
				date: texts[0] ?? "",
				roundName: texts[1] ?? "",
				amount: texts[2] ?? null,
				leadInvestors: texts.slice(3).filter((t) => t.length > 0),
			});
		}
	});

	return rounds;
}

function extractRecentNews($: cheerio.CheerioAPI): { title: string; url: string; date: string }[] {
	const news: { title: string; url: string; date: string }[] = [];

	const newsItems = $('[class*="news"] a, [class*="press"] a, [class*="recent-news"] a');

	newsItems.slice(0, 5).each((_i, el) => {
		const $el = $(el);
		const title = $el.text().trim();
		const href = $el.attr("href") ?? "";
		if (!title || !href) return;

		const dateEl = $el.closest("[class*='news']").find("time, [class*='date']").first();
		const date = dateEl.attr("datetime") ?? dateEl.text().trim() ?? "";

		news.push({ title, url: href, date });
	});

	return news;
}

function emptyCrunchbaseData(competitorName: string, slug: string): CrunchbaseData {
	return {
		competitorName,
		crunchbaseSlug: slug,
		collectedAt: new Date().toISOString(),
		description: null,
		totalFunding: null,
		lastFundingRound: null,
		lastFundingDate: null,
		employeeRange: null,
		fundingRounds: [],
		recentNews: [],
	};
}
