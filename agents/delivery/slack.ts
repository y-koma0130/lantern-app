interface SlackMessage {
	webhookUrl: string;
	orgName: string;
	weekOf: string;
	markdown: string;
}

export async function sendSlackMessage(params: SlackMessage): Promise<void> {
	const blocks = [
		{
			type: "header",
			text: {
				type: "plain_text",
				text: `Lantern Weekly Digest — ${params.weekOf}`,
			},
		},
		{
			type: "context",
			elements: [
				{
					type: "mrkdwn",
					text: `*${params.orgName}* · Competitive Intelligence Report`,
				},
			],
		},
		{ type: "divider" },
		{
			type: "section",
			text: {
				type: "mrkdwn",
				text: truncateForSlack(params.markdown),
			},
		},
	];

	const response = await fetch(params.webhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ blocks }),
	});

	if (!response.ok) {
		throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
	}
}

function truncateForSlack(markdown: string): string {
	// Slack block text limit is ~3000 characters
	const limit = 2900;
	if (markdown.length <= limit) return markdown;
	return `${markdown.slice(0, limit)}...\n\n_View the full digest in Lantern._`;
}
