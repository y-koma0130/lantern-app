import { marked } from "marked";

export interface FormattedDigest {
	markdown: string;
	html: string;
}

export function formatDigest(rawMarkdown: string, weekOf: string): FormattedDigest {
	const markdown = rawMarkdown.trim();
	const body = marked.parse(markdown) as string;

	const html = buildEmailHtml(body, weekOf);

	return { markdown, html };
}

function buildEmailHtml(bodyHtml: string, weekOf: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Lantern Weekly Digest — ${weekOf}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F5F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F4F5F7;">
<tr>
<td align="center" style="padding: 32px 16px;">

<!-- Header -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
<tr>
<td style="padding: 16px 32px; background-color: #06b6d4; border-radius: 8px 8px 0 0;">
	<p style="margin: 0; color: #FFFFFF; font-size: 14px; font-weight: 600;">Lantern <span style="font-weight: 400; color: #B3D4FF;">— Weekly Digest, ${weekOf}</span></p>
</td>
</tr>
</table>

<!-- Content -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
<tr>
<td style="padding: 32px; background-color: #FFFFFF; border-left: 1px solid #DFE1E6; border-right: 1px solid #DFE1E6;">
	<div style="color: #172B4D; font-size: 14px; line-height: 1.6;">
		${applyInlineStyles(bodyHtml)}
	</div>
</td>
</tr>
</table>

<!-- Footer -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
<tr>
<td style="padding: 20px 32px; background-color: #FAFBFC; border: 1px solid #DFE1E6; border-top: none; border-radius: 0 0 8px 8px;">
	<p style="margin: 0; color: #97A0AF; font-size: 12px; text-align: center;">
		Powered by <a href="https://lantern.app" style="color: #06b6d4; text-decoration: none;">Lantern</a> — Competitive intelligence for cybersecurity teams.
	</p>
</td>
</tr>
</table>

</td>
</tr>
</table>
</body>
</html>`;
}

function applyInlineStyles(html: string): string {
	return html
		.replace(
			/<h1/g,
			'<h1 style="margin: 24px 0 8px; color: #172B4D; font-size: 20px; font-weight: 600; border-bottom: 1px solid #DFE1E6; padding-bottom: 8px;"',
		)
		.replace(
			/<h2/g,
			'<h2 style="margin: 20px 0 8px; color: #172B4D; font-size: 16px; font-weight: 600;"',
		)
		.replace(
			/<h3/g,
			'<h3 style="margin: 16px 0 6px; color: #505F79; font-size: 14px; font-weight: 600;"',
		)
		.replace(
			/<h4/g,
			'<h4 style="margin: 12px 0 4px; color: #505F79; font-size: 13px; font-weight: 600;"',
		)
		.replace(
			/<p>/g,
			'<p style="margin: 0 0 12px; color: #172B4D; font-size: 14px; line-height: 1.6;">',
		)
		.replace(/<ul>/g, '<ul style="margin: 0 0 12px; padding-left: 20px;">')
		.replace(/<ol>/g, '<ol style="margin: 0 0 12px; padding-left: 20px;">')
		.replace(
			/<li>/g,
			'<li style="margin: 0 0 4px; color: #172B4D; font-size: 14px; line-height: 1.5;">',
		)
		.replace(/<a /g, '<a style="color: #06b6d4; text-decoration: underline;" ')
		.replace(/<strong>/g, '<strong style="color: #172B4D; font-weight: 600;">')
		.replace(
			/<blockquote>/g,
			'<blockquote style="margin: 12px 0; padding: 8px 16px; border-left: 3px solid #06b6d4; background-color: #F4F5F7; color: #505F79; font-size: 13px;">',
		)
		.replace(
			/<code>/g,
			'<code style="background-color: #F4F5F7; padding: 1px 4px; border-radius: 3px; font-size: 13px; color: #505F79;">',
		)
		.replace(
			/<hr\s*\/?>/g,
			'<hr style="border: none; border-top: 1px solid #DFE1E6; margin: 20px 0;" />',
		);
}
