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
			<p className="mb-4 text-sm text-text-secondary">
				<span className="font-semibold text-text-primary">Week of {formatDate(weekOf)}</span>
				<span className="mx-2 text-text-tertiary">&middot;</span>
				<span className="text-text-tertiary">Generated {formatDate(generatedAt)}</span>
			</p>
			<div
				className="digest-content rounded-[3px] border border-border bg-white p-6"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: pipeline-generated HTML, not user input
				dangerouslySetInnerHTML={{ __html: contentHtml }}
			/>
		</div>
	);
}
