import { filterRelevantHnStories } from "../../shared/page-utils.js";
import type { Competitor } from "../../shared/types.js";

export interface HnStory {
	objectID: string;
	title: string;
	url: string | null;
	author: string;
	points: number;
	numComments: number;
	createdAt: string;
}

export interface HnData {
	competitorName: string;
	query: string;
	collectedAt: string;
	stories: HnStory[];
	totalHits: number;
}

interface AlgoliaHit {
	objectID: string;
	title: string;
	url: string | null;
	author: string;
	points: number;
	num_comments: number;
	created_at: string;
}

interface AlgoliaResponse {
	hits: AlgoliaHit[];
	nbHits: number;
}

const ALGOLIA_BASE = "https://hn.algolia.com/api/v1";
const MAX_STORIES = 20;
/** Only fetch stories from the last 7 days */
const LOOKBACK_SECONDS = 7 * 24 * 60 * 60;

function buildSearchQuery(competitor: Competitor): string {
	// Use competitor name as primary search term
	return competitor.name;
}

export async function collectHnMentions(competitor: Competitor): Promise<HnData> {
	const query = buildSearchQuery(competitor);
	console.log(`[HN] Searching for "${query}"`);

	const since = Math.floor(Date.now() / 1000) - LOOKBACK_SECONDS;
	const params = new URLSearchParams({
		query,
		tags: "(story,show_hn,ask_hn)",
		numericFilters: `created_at_i>${since}`,
		hitsPerPage: String(MAX_STORIES),
	});

	const url = `${ALGOLIA_BASE}/search?${params.toString()}`;

	try {
		const res = await fetch(url, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(10_000),
		});

		if (!res.ok) {
			console.warn(`[HN] Algolia returned ${res.status} for "${query}"`);
			return emptyHnData(competitor.name, query);
		}

		const json = (await res.json()) as AlgoliaResponse;

		const allStories: HnStory[] = json.hits.map((hit) => ({
			objectID: hit.objectID,
			title: hit.title,
			url: hit.url,
			author: hit.author,
			points: hit.points ?? 0,
			numComments: hit.num_comments ?? 0,
			createdAt: hit.created_at,
		}));

		const stories = filterRelevantHnStories(allStories, competitor.name);

		console.log(
			`[HN] Found ${allStories.length} stories for "${query}", ${stories.length} relevant`,
		);

		return {
			competitorName: competitor.name,
			query,
			collectedAt: new Date().toISOString(),
			stories,
			totalHits: json.nbHits,
		};
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.warn(`[HN] Failed to search for "${query}": ${message}`);
		return emptyHnData(competitor.name, query);
	}
}

function emptyHnData(competitorName: string, query: string): HnData {
	return {
		competitorName,
		query,
		collectedAt: new Date().toISOString(),
		stories: [],
		totalHits: 0,
	};
}
