interface DiscordMessage {
	webhookUrl: string;
	orgName: string;
	weekOf: string;
	markdown: string;
}

export async function sendDiscordMessage(params: DiscordMessage): Promise<void> {
	const content = formatDiscordContent(params);

	const response = await fetch(params.webhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			username: "Lantern",
			embeds: [
				{
					title: `Weekly Digest — ${params.weekOf}`,
					description: content,
					color: 0x0052cc,
					footer: {
						text: `${params.orgName} · Powered by Lantern`,
					},
					timestamp: new Date().toISOString(),
				},
			],
		}),
	});

	if (!response.ok) {
		throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
	}
}

function formatDiscordContent(params: DiscordMessage): string {
	// Discord embed description limit is 4096 characters
	const limit = 4000;
	const markdown = params.markdown;
	if (markdown.length <= limit) return markdown;
	return `${markdown.slice(0, limit)}...\n\n*View the full digest in Lantern.*`;
}
