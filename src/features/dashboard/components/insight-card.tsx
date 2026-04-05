interface InsightCardProps {
	type: string;
	competitorName: string;
	summary: string;
	importanceScore: number;
}

const TYPE_COLORS: Record<string, string> = {
	pricing: "#FF5630",
	feature: "#36B37E",
	hiring: "#6554C0",
	funding: "#FFAB00",
	sentiment: "#00B8D9",
	messaging: "#505F79",
};

export function InsightCard({ type, competitorName, summary, importanceScore }: InsightCardProps) {
	const color = TYPE_COLORS[type] ?? "#505F79";

	return (
		<div className="rounded-[3px] border border-[#DFE1E6] bg-white p-4">
			<div className="mb-2 flex items-center justify-between gap-2">
				<span
					className="inline-block rounded-[3px] px-2 py-0.5 text-xs font-semibold text-white"
					style={{ backgroundColor: color }}
				>
					{type}
				</span>
				<span
					className="text-xs font-medium text-[#97A0AF]"
					title={`Importance: ${importanceScore}/10`}
				>
					{importanceScore}/10
				</span>
			</div>
			<p className="mb-1 text-sm font-semibold text-[#172B4D]">{competitorName}</p>
			<p className="text-sm leading-relaxed text-[#505F79]">{summary}</p>
		</div>
	);
}
