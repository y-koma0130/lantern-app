export interface FormattedDigest {
	markdown: string;
	html: string;
}

export function formatDigest(rawMarkdown: string): FormattedDigest {
	const markdown = rawMarkdown.trim();

	// TODO: replace with a proper Markdown-to-HTML library (marked/remark)
	const html = `<div class="digest">${escapeHtml(markdown)}</div>`;

	return { markdown, html };
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
