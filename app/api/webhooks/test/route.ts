import { isErrorResponse, requireUser, zodErrorResponse } from "@/lib/api";
import { NextResponse } from "next/server";
import { z } from "zod";

const testWebhookSchema = z.object({
	type: z.enum(["slack", "discord"]),
	url: z.string().url(),
});

export async function POST(request: Request) {
	try {
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;

		const body = await request.json();
		const parsed = testWebhookSchema.safeParse(body);
		if (!parsed.success) return zodErrorResponse(parsed);

		const { type, url } = parsed.data;

		if (type === "slack") {
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					blocks: [
						{
							type: "section",
							text: {
								type: "mrkdwn",
								text: ":white_check_mark: *Lantern connected successfully!*\nThis channel will receive competitive intelligence digests.",
							},
						},
					],
				}),
			});

			if (!res.ok) {
				return NextResponse.json(
					{ error: `Slack returned ${res.status}. Please check the webhook URL.` },
					{ status: 400 },
				);
			}
		}

		if (type === "discord") {
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username: "Lantern",
					embeds: [
						{
							title: "Connection Successful",
							description:
								"Lantern is connected! This channel will receive competitive intelligence digests.",
							color: 0x36b37e,
						},
					],
				}),
			});

			if (!res.ok) {
				return NextResponse.json(
					{ error: `Discord returned ${res.status}. Please check the webhook URL.` },
					{ status: 400 },
				);
			}
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
