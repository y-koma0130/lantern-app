import * as cheerio from "cheerio";
import { fetchRenderedHtml } from "../../shared/browser.js";
import type { Competitor } from "../../shared/types.js";

interface G2Review {
	reviewerTitle: string;
	rating: number | null;
	date: string;
	pros: string;
	cons: string;
}

export interface G2Data {
	g2Url: string;
	scrapedAt: string;
	overallRating: number | null;
	totalReviews: number | null;
	category: string | null;
	categoryRank: number | null;
	recentReviews: G2Review[];
}

type CheerioSelection = ReturnType<cheerio.CheerioAPI>;

const MAX_REVIEWS = 10;

function parseFloatSafe(value: string | undefined | null): number | null {
	if (value == null) return null;
	const num = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
	return Number.isNaN(num) ? null : num;
}

function parseIntSafe(value: string | undefined | null): number | null {
	if (value == null) return null;
	const num = Number.parseInt(value.replace(/[^0-9]/g, ""), 10);
	return Number.isNaN(num) ? null : num;
}

function extractFromJsonLd($: cheerio.CheerioAPI): Record<string, unknown> {
	const extracted: Record<string, unknown> = {};
	const scripts = $('script[type="application/ld+json"]');

	scripts.each((_i, el) => {
		const text = $(el).html();
		if (!text) return;
		try {
			const data: unknown = JSON.parse(text);
			findInJsonLd(data, extracted);
		} catch {
			// Malformed JSON-LD
		}
	});

	return extracted;
}

function findInJsonLd(data: unknown, result: Record<string, unknown>): void {
	if (data == null || typeof data !== "object") return;

	if (Array.isArray(data)) {
		for (const item of data) {
			findInJsonLd(item, result);
		}
		return;
	}

	const record = data as Record<string, unknown>;

	if (typeof record.aggregateRating === "object" && record.aggregateRating != null) {
		const agg = record.aggregateRating as Record<string, unknown>;
		if ("ratingValue" in agg) result.ratingValue = agg.ratingValue;
		if ("reviewCount" in agg) result.reviewCount = agg.reviewCount;
	}

	if ("category" in record && !result.category) {
		result.category = record.category;
	}

	for (const val of Object.values(record)) {
		if (typeof val === "object" && val != null) {
			findInJsonLd(val, result);
		}
	}
}

function extractRatingFromStars($el: CheerioSelection, $: cheerio.CheerioAPI): number | null {
	const ariaLabel = $el.attr("aria-label") ?? $el.find("[aria-label]").first().attr("aria-label");
	if (ariaLabel) {
		const match = ariaLabel.match(/([\d.]+)\s*(?:out of|\/)\s*[\d.]+/);
		if (match?.[1]) return parseFloatSafe(match[1]);
	}

	const title = $el.attr("title") ?? $el.find("[title]").first().attr("title");
	if (title) {
		const match = title.match(/([\d.]+)/);
		if (match?.[1]) return parseFloatSafe(match[1]);
	}

	const dataRating =
		$el.attr("data-rating") ?? $el.find("[data-rating]").first().attr("data-rating");
	if (dataRating) return parseFloatSafe(dataRating);

	const filledStars = $el.find(".star.fill, .star-filled, [class*='filled']").length;
	if (filledStars > 0 && filledStars <= 5) return filledStars;

	return null;
}

function extractOverallRating(
	$: cheerio.CheerioAPI,
	jsonLd: Record<string, unknown>,
): number | null {
	if (jsonLd.ratingValue != null) return parseFloatSafe(String(jsonLd.ratingValue));

	const metaRating = $('meta[itemprop="ratingValue"]').attr("content");
	if (metaRating) return parseFloatSafe(metaRating);

	const starWrapper = $(
		'[class*="star-wrapper"], [class*="overall-rating"], [class*="avg-rating"]',
	).first();
	if (starWrapper.length) {
		const text = starWrapper.text().trim();
		const match = text.match(/([\d.]+)/);
		if (match?.[1]) return parseFloatSafe(match[1]);
	}

	const ratingDisplay = $(".product-head__rating, [data-testid='product-rating']").first();
	if (ratingDisplay.length) return extractRatingFromStars(ratingDisplay, $);

	return null;
}

function extractTotalReviews(
	$: cheerio.CheerioAPI,
	jsonLd: Record<string, unknown>,
): number | null {
	if (jsonLd.reviewCount != null) return parseIntSafe(String(jsonLd.reviewCount));

	const metaCount = $('meta[itemprop="reviewCount"]').attr("content");
	if (metaCount) return parseIntSafe(metaCount);

	const reviewCountTexts = [
		$('[class*="review-count"], [class*="reviews-count"], [data-testid*="review-count"]')
			.first()
			.text(),
		$("a[href*='reviews']").first().text(),
	];

	for (const text of reviewCountTexts) {
		if (!text) continue;
		const match = text.match(/([\d,]+)\s*reviews?/i);
		if (match?.[1]) return parseIntSafe(match[1]);
	}

	return null;
}

function extractCategory(
	$: cheerio.CheerioAPI,
	jsonLd: Record<string, unknown>,
): { category: string | null; categoryRank: number | null } {
	let category: string | null = null;
	let categoryRank: number | null = null;

	const categoryLink = $(
		'a[href*="/categories/"], [class*="breadcrumb"] a, [class*="category-link"]',
	).first();
	if (categoryLink.length) {
		category = categoryLink.text().trim() || null;
	}

	const rankText = $('[class*="rank"], [class*="badge"], [class*="leader"], [data-testid*="rank"]')
		.first()
		.text()
		.trim();
	if (rankText) {
		const rankMatch = rankText.match(/#(\d+)/);
		if (rankMatch?.[1]) categoryRank = parseIntSafe(rankMatch[1]);
	}

	if (!category && typeof jsonLd.category === "string") {
		category = jsonLd.category;
	}

	return { category, categoryRank };
}

function extractReviews($: cheerio.CheerioAPI): G2Review[] {
	const reviews: G2Review[] = [];
	const reviewSelectors = [
		"[id^='survey-response']",
		"[class*='review-listing'] [class*='review']",
		"[data-testid*='review']",
		".paper--box [itemprop='review']",
		"[itemprop='review']",
		"[class*='review-card']",
	];

	let reviewEls: CheerioSelection | null = null;
	for (const selector of reviewSelectors) {
		const els = $(selector);
		if (els.length > 0) {
			reviewEls = els;
			break;
		}
	}

	if (!reviewEls) return reviews;

	reviewEls.slice(0, MAX_REVIEWS).each((_i, el) => {
		const $el = $(el);

		const reviewerTitle =
			$el
				.find('[itemprop="author"], [class*="reviewer"], [class*="user-title"]')
				.first()
				.text()
				.trim() ||
			$el.find('[class*="job-title"], [class*="role"]').first().text().trim() ||
			"";

		const ratingEl = $el
			.find('[class*="star"], [itemprop="ratingValue"], [class*="rating"]')
			.first();
		let rating: number | null = null;
		if (ratingEl.length) {
			rating = extractRatingFromStars(ratingEl, $);
			if (rating == null) {
				rating = parseFloatSafe(ratingEl.attr("content") ?? ratingEl.text().trim());
			}
		}

		const dateEl = $el
			.find('[itemprop="datePublished"], time, [class*="date"], [datetime]')
			.first();
		const date = dateEl.attr("datetime") ?? dateEl.attr("content") ?? dateEl.text().trim();

		let pros = "";
		let cons = "";

		const prosEl = $el.find('[data-testid*="pros"], [class*="pros"], [id*="pros"]').first();
		const consEl = $el.find('[data-testid*="cons"], [class*="cons"], [id*="cons"]').first();

		if (prosEl.length) pros = prosEl.text().trim();
		if (consEl.length) cons = consEl.text().trim();

		reviews.push({ reviewerTitle, rating, date, pros, cons });
	});

	return reviews;
}

function emptyG2Data(url: string): G2Data {
	return {
		g2Url: url,
		scrapedAt: new Date().toISOString(),
		overallRating: null,
		totalReviews: null,
		category: null,
		categoryRank: null,
		recentReviews: [],
	};
}

export async function collectG2Reviews(competitor: Competitor): Promise<G2Data> {
	const url = competitor.g2Url ?? "";
	if (!url) {
		console.warn(`[Collector] No G2 URL for ${competitor.name}, skipping`);
		return emptyG2Data("");
	}
	console.log(`[Collector] Fetching G2 reviews for ${competitor.name}: ${url}`);

	const html = await fetchRenderedHtml(url, {
		waitForSelector: "[itemprop='review'], [id^='survey-response']",
	});

	if (!html) return emptyG2Data(url);

	try {
		const $ = cheerio.load(html);
		const jsonLd = extractFromJsonLd($);
		const { category, categoryRank } = extractCategory($, jsonLd);

		return {
			g2Url: url,
			scrapedAt: new Date().toISOString(),
			overallRating: extractOverallRating($, jsonLd),
			totalReviews: extractTotalReviews($, jsonLd),
			category,
			categoryRank,
			recentReviews: extractReviews($),
		};
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.warn(`[Collector] Failed to parse G2 page for ${competitor.name}: ${message}`);
		return emptyG2Data(url);
	}
}
