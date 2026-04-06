import { isErrorResponse, requireUser, zodErrorResponse } from "@/lib/api";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
	orgId: z.string().uuid(),
	serviceName: z.string().min(1).max(200),
	serviceUrl: z.string().url(),
});

export async function POST(request: Request) {
	try {
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { user, supabase } = auth;

		const body = await request.json();
		const parsed = requestSchema.safeParse(body);
		if (!parsed.success) return zodErrorResponse(parsed);

		const { orgId, serviceName, serviceUrl } = parsed.data;

		// Verify user is a member of this org
		const { data: membership } = await supabase
			.from("organization_members")
			.select("role")
			.eq("org_id", orgId)
			.eq("user_id", user.id)
			.single();

		if (!membership) {
			return NextResponse.json({ error: "Organization not found" }, { status: 404 });
		}

		// Fetch org name + site content in parallel
		const [orgResult, siteResult] = await Promise.all([
			supabase.from("organizations").select("name").eq("id", orgId).single(),
			fetchSiteContent(serviceUrl),
		]);

		const orgName = orgResult.data?.name ?? orgId;

		// Analyze with Claude
		let analysis = "Analysis unavailable";
		if (siteResult) {
			try {
				const client = new Anthropic();
				const response = await client.messages.create({
					model: "claude-sonnet-4-20250514",
					max_tokens: 500,
					messages: [
						{
							role: "user",
							content: `Analyze this website and determine if it's a cybersecurity SaaS company. Respond in JSON format with:
- "isCyberSecurity": boolean
- "category": string (e.g., "Cloud Security", "Endpoint Security", "GRC", "IAM", "Application Security", "Threat Intelligence", or "Other")
- "summary": string (1-2 sentence description of what they do)
- "confidence": "high" | "medium" | "low"

Service name: ${serviceName}
URL: ${serviceUrl}
Website content excerpt:
${siteResult}`,
						},
					],
				});

				const textBlock = response.content[0];
				if (textBlock?.type === "text") {
					analysis = textBlock.text;
				}
			} catch {
				analysis = "LLM analysis failed";
			}
		}

		// Send to admin Discord
		await notifyAdminDiscord({
			serviceName,
			serviceUrl,
			orgName,
			userEmail: user.email ?? "Unknown",
			analysis,
		});

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

async function fetchSiteContent(url: string): Promise<string | null> {
	try {
		const res = await fetch(url, {
			headers: { "User-Agent": "LanternBot/1.0" },
			signal: AbortSignal.timeout(10_000),
		});
		if (!res.ok) return null;
		const html = await res.text();
		return html
			.replace(/<script[\s\S]*?<\/script>/gi, "")
			.replace(/<style[\s\S]*?<\/style>/gi, "")
			.replace(/<[^>]+>/g, " ")
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, 3000);
	} catch {
		return null;
	}
}

async function notifyAdminDiscord(params: {
	serviceName: string;
	serviceUrl: string;
	orgName: string;
	userEmail: string;
	analysis: string;
}): Promise<void> {
	const discordUrl = process.env.ADMIN_DISCORD_WEBHOOK_URL;
	if (!discordUrl) return;

	let parsed: {
		isCyberSecurity?: boolean;
		category?: string;
		summary?: string;
		confidence?: string;
	} = {};
	try {
		parsed = JSON.parse(params.analysis);
	} catch {
		// not JSON
	}

	const isCyber = parsed.isCyberSecurity;
	const statusEmoji =
		isCyber === true ? ":white_check_mark:" : isCyber === false ? ":x:" : ":question:";

	await fetch(discordUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			username: "Lantern",
			embeds: [
				{
					title: "New Competitor Request",
					color: isCyber ? 0x36b37e : 0xff5630,
					fields: [
						{ name: "Service", value: params.serviceName, inline: true },
						{ name: "URL", value: params.serviceUrl, inline: true },
						{ name: "Org", value: params.orgName, inline: true },
						{ name: "Requested by", value: params.userEmail, inline: true },
						{
							name: `${statusEmoji} CyberSec Check`,
							value:
								parsed.isCyberSecurity !== undefined
									? `**${parsed.isCyberSecurity ? "Yes" : "No"}** (${parsed.confidence ?? "unknown"} confidence)`
									: params.analysis.slice(0, 200),
						},
						...(parsed.category
							? [{ name: "Category", value: parsed.category, inline: true }]
							: []),
						...(parsed.summary ? [{ name: "Summary", value: parsed.summary }] : []),
					],
					timestamp: new Date().toISOString(),
				},
			],
		}),
	});
}
