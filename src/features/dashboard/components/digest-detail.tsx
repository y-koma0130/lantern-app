interface DigestDetailProps {
	weekOf: string;
	generatedAt: string;
	contentHtml: string;
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function DigestDetail({ weekOf, generatedAt, contentHtml }: DigestDetailProps) {
	return (
		<div>
			<div className="mb-6 flex items-center gap-4">
				<h1 className="text-xl font-semibold text-[#172B4D]">Week of {formatDate(weekOf)}</h1>
				<span className="text-sm text-[#97A0AF]">Generated {formatDate(generatedAt)}</span>
			</div>
			<div
				className="digest-content rounded-[3px] border border-[#DFE1E6] bg-white p-6"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: pipeline-generated HTML, not user input
				dangerouslySetInnerHTML={{ __html: contentHtml }}
			/>
		</div>
	);
}
