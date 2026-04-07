import { getInsightConfig } from "../lib/insight-types";

interface InsightCardProps {
	type: string;
	competitorName: string;
	summary: string;
	importanceScore: number;
	diffDetail: Record<string, unknown>;
}

/** Extract human-readable context lines from diff_detail based on insight type */
function extractContext(detail: Record<string, unknown>): string[] {
	const lines: string[] = [];

	// LLM-summarized website changes (new enriched format)
	if (Array.isArray(detail.changes) && (detail.changes as string[]).length > 0) {
		for (const change of (detail.changes as string[]).slice(0, 2)) {
			lines.push(change);
		}
		if (detail.salesImplication) {
			lines.push(`→ ${detail.salesImplication}`);
		}
	}

	// Fallback: raw Before → After (for non-enriched diffs)
	if (
		!Array.isArray(detail.changes) &&
		detail.previous !== undefined &&
		detail.current !== undefined
	) {
		const prev = String(detail.previous).slice(0, 120).trim();
		const curr = String(detail.current).slice(0, 120).trim();
		if (prev) lines.push(`Before: "${prev}…"`);
		if (curr) lines.push(`After: "${curr}…"`);
	}

	// Added / removed headings
	if (Array.isArray(detail.added) && (detail.added as string[]).length > 0) {
		lines.push(`Added: ${(detail.added as string[]).slice(0, 3).join(", ")}`);
	}
	if (Array.isArray(detail.removed) && (detail.removed as string[]).length > 0) {
		lines.push(`Removed: ${(detail.removed as string[]).slice(0, 3).join(", ")}`);
	}

	// G2 sentiment — sales signals are the highest value
	if (Array.isArray(detail.signals) && (detail.signals as string[]).length > 0) {
		for (const signal of (detail.signals as string[]).slice(0, 2)) {
			lines.push(signal);
		}
	}

	// G2 sentiment — keyword details
	if (detail.keyword) {
		lines.push(
			`"${detail.keyword}": ${detail.previousCount ?? 0} → ${detail.currentCount ?? 0} mentions`,
		);
	}

	// Emerging / fading themes
	if (detail.theme) {
		lines.push(`Theme: ${detail.theme}`);
	}

	// Top keywords summary
	if (Array.isArray(detail.topKeywords) && !detail.signals) {
		const kws = detail.topKeywords as { word: string; count: number; sentiment: string }[];
		const negatives = kws.filter((k) => k.sentiment === "negative").slice(0, 3);
		if (negatives.length > 0) {
			lines.push(`Negative: ${negatives.map((k) => `${k.word} (${k.count}x)`).join(", ")}`);
		}
	}

	// HN story details
	if (detail.storyId) {
		lines.push(`${detail.points} points, ${detail.numComments} comments`);
		if (detail.url) lines.push(String(detail.url));
	}
	if (Array.isArray(detail.stories)) {
		const stories = detail.stories as { title: string; points: number }[];
		for (const s of stories.slice(0, 2)) {
			lines.push(`"${s.title}" (${s.points}pt)`);
		}
	}

	// Funding round
	if (detail.roundName) {
		let line = String(detail.roundName);
		if (detail.amount) line += ` — ${detail.amount}`;
		lines.push(line);
		if (Array.isArray(detail.leadInvestors) && (detail.leadInvestors as string[]).length > 0) {
			lines.push(`Led by ${(detail.leadInvestors as string[]).join(", ")}`);
		}
	}

	// Employee range change
	if (detail.field === "employeeRange" && detail.previous && detail.current) {
		lines.length = 0; // clear generic before/after
		lines.push(`${detail.previous} → ${detail.current}`);
	}

	return lines.slice(0, 3);
}

export function InsightCard({
	type,
	competitorName,
	summary,
	importanceScore,
	diffDetail,
}: InsightCardProps) {
	const config = getInsightConfig(type);
	const contextLines = extractContext(diffDetail);

	return (
		<div className="rounded-[3px] border border-border bg-white p-4">
			<div className="mb-2 flex items-center justify-between gap-2">
				<span
					className="inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-xs font-semibold"
					style={{ backgroundColor: config.bg, color: config.text }}
				>
					<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
						<path d={config.iconPath} />
					</svg>
					{config.label}
				</span>
				<span
					className="text-xs font-medium text-text-tertiary"
					title={`Importance: ${importanceScore}/100`}
				>
					{importanceScore}
				</span>
			</div>
			<p className="mb-1 text-sm font-semibold text-text-primary">{competitorName}</p>
			<p className="text-sm leading-relaxed text-text-secondary">{summary}</p>
			{contextLines.length > 0 && (
				<ul className="mt-2 space-y-0.5 border-t border-border pt-2">
					{contextLines.map((line) => (
						<li
							key={line}
							className="truncate text-xs leading-relaxed text-text-tertiary"
							title={line}
						>
							{line}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
