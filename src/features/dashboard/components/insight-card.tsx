interface InsightCardProps {
	type: string;
	competitorName: string;
	summary: string;
	importanceScore: number;
}

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
	pricing: { bg: "#FFEBE6", text: "#BF2600" },
	feature: { bg: "#E3FCEF", text: "#006644" },
	hiring: { bg: "#EAE6FF", text: "#403294" },
	funding: { bg: "#FFFAE6", text: "#946300" },
	sentiment: { bg: "#E6FCFF", text: "#006A80" },
	messaging: { bg: "#EBECF0", text: "#344563" },
};

export function InsightCard({ type, competitorName, summary, importanceScore }: InsightCardProps) {
	const style = TYPE_STYLES[type] ?? { bg: "#EBECF0", text: "#344563" };

	return (
		<div className="rounded-[3px] border border-border bg-white p-4">
			<div className="mb-2 flex items-center justify-between gap-2">
				<span
					className="inline-block rounded-[3px] px-2 py-0.5 text-xs font-semibold"
					style={{ backgroundColor: style.bg, color: style.text }}
				>
					{type}
				</span>
				<span
					className="text-xs font-medium text-text-tertiary"
					title={`Importance: ${importanceScore}/10`}
				>
					{importanceScore}/10
				</span>
			</div>
			<p className="mb-1 text-sm font-semibold text-text-primary">{competitorName}</p>
			<p className="text-sm leading-relaxed text-text-secondary">{summary}</p>
		</div>
	);
}
