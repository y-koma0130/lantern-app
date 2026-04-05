import { marked } from "marked";

export interface FormattedDigest {
	markdown: string;
	html: string;
}

export function formatDigest(rawMarkdown: string): FormattedDigest {
	const markdown = rawMarkdown.trim();
	const body = marked.parse(markdown) as string;
	const html = `<div class="digest">${body}</div>`;

	return { markdown, html };
}
