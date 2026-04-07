import Link from "next/link";

interface DigestListItemProps {
	id: string;
	weekOf: string;
	generatedAt: string;
	orgSlug: string;
	contentMd: string;
}

function stripMarkdown(md: string): string {
	return md
		.replace(/#{1,6}\s+/g, "")
		.replace(/\*\*(.+?)\*\*/g, "$1")
		.replace(/\*(.+?)\*/g, "$1")
		.replace(/\[(.+?)\]\(.+?\)/g, "$1")
		.replace(/[`~>-]/g, "")
		.replace(/\n+/g, " ")
		.trim();
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

/** Extract section headings (h2/h3/h4) from markdown to show as source badges */
function extractSections(md: string): string[] {
	const headings = md.match(/^#{2,4}\s+(.+)$/gm);
	if (!headings) return [];
	return headings
		.map((h) => h.replace(/^#{2,4}\s+/, "").trim())
		.filter((h) => h.length > 0)
		.slice(0, 5);
}

export function DigestListItem({
	id,
	weekOf,
	generatedAt,
	orgSlug,
	contentMd,
}: DigestListItemProps) {
	const preview = stripMarkdown(contentMd).slice(0, 150);
	const sections = extractSections(contentMd);

	return (
		<Link
			href={`/${orgSlug}/dashboard/${id}`}
			className="block rounded-[3px] border border-border bg-white p-4 transition-colors hover:border-brand-subtle hover:bg-surface-subtle"
		>
			<div className="mb-1 flex items-center gap-3">
				<span className="text-sm font-semibold text-text-primary">
					Week of {formatDate(weekOf)}
				</span>
				<span className="text-xs text-text-tertiary">Generated {formatDate(generatedAt)}</span>
			</div>
			{sections.length > 0 && (
				<div className="mb-2 flex flex-wrap gap-1.5">
					{sections.map((section) => (
						<span
							key={section}
							className="inline-block rounded-[3px] bg-surface-hover px-1.5 py-0.5 text-xs text-text-secondary"
						>
							{section}
						</span>
					))}
				</div>
			)}
			<p className="text-sm leading-relaxed text-text-secondary">
				{preview}
				{stripMarkdown(contentMd).length > 150 ? "..." : ""}
			</p>
		</Link>
	);
}
