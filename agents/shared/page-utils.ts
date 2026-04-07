const ERROR_PAGE_PATTERNS = [/^404\b/i, /page\s*not\s*found/i, /not\s*found\s*\|/i, /^error\b/i];

export function isErrorPage(title: string, bodyText: string): boolean {
	const text = `${title} ${bodyText.slice(0, 200)}`;
	return ERROR_PAGE_PATTERNS.some((p) => p.test(text));
}

/**
 * Filter HN stories to only those that actually mention the competitor name in title or URL.
 * For short names (<=4 chars), uses word boundary matching to avoid false positives.
 */
export function filterRelevantHnStories<T extends { title: string; url: string | null }>(
	stories: T[],
	competitorName: string,
): T[] {
	const nameLower = competitorName.toLowerCase();
	const isShortName = nameLower.length <= 4;
	const pattern = isShortName ? new RegExp(`\\b${nameLower}\\b`, "i") : new RegExp(nameLower, "i");

	return stories.filter((s) => {
		const text = `${s.title} ${s.url ?? ""}`;
		return pattern.test(text);
	});
}
