import { getInsightConfig } from "../lib/insight-types";

interface InsightCardProps {
	type: string;
	competitorName: string;
	summary: string;
	importanceScore: number;
}

export function InsightCard({ type, competitorName, summary, importanceScore }: InsightCardProps) {
	const config = getInsightConfig(type);

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
		</div>
	);
}
