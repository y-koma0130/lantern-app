import { Resend } from "resend";

let resendClient: Resend | undefined;

function getResend(): Resend {
	if (!resendClient) {
		const apiKey = process.env.RESEND_API_KEY;
		if (!apiKey) {
			throw new Error("Missing environment variable: RESEND_API_KEY");
		}
		resendClient = new Resend(apiKey);
	}
	return resendClient;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export async function sendInvitationEmail(params: {
	to: string;
	orgName: string;
	inviterEmail: string;
	inviteUrl: string;
}): Promise<void> {
	const resend = getResend();
	const orgName = escapeHtml(params.orgName);
	const inviterEmail = escapeHtml(params.inviterEmail);

	await resend.emails.send({
		from: "Lantern <noreply@lantern.app>",
		to: params.to,
		subject: `You've been invited to join ${params.orgName} on Lantern`,
		html: `
			<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
				<h2 style="color: #172B4D; margin-bottom: 16px;">You've been invited to join ${orgName}</h2>
				<p style="color: #505F79; font-size: 14px; line-height: 1.6;">
					${inviterEmail} has invited you to join <strong>${orgName}</strong> on Lantern.
				</p>
				<div style="margin: 32px 0;">
					<a href="${params.inviteUrl}"
						style="display: inline-block; background-color: #0052CC; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 3px; font-size: 14px; font-weight: 500;">
						Accept Invitation
					</a>
				</div>
				<p style="color: #97A0AF; font-size: 12px;">
					If you weren't expecting this invitation, you can safely ignore this email.
				</p>
			</div>
		`,
	});
}
