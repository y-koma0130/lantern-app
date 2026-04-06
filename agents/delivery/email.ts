import { Resend } from "resend";

let resendClient: Resend | undefined;

function getResend(): Resend {
	if (!resendClient) {
		const apiKey = process.env.RESEND_API_KEY;
		if (!apiKey) throw new Error("Missing RESEND_API_KEY");
		resendClient = new Resend(apiKey);
	}
	return resendClient;
}

interface EmailParams {
	to: string;
	subject: string;
	html: string;
}

export async function sendEmail(params: EmailParams): Promise<void> {
	const resend = getResend();

	const { error } = await resend.emails.send({
		from: "Lantern <digest@lantern.app>",
		to: params.to,
		subject: params.subject,
		html: params.html,
	});

	if (error) {
		throw new Error(`Resend email failed: ${error.message}`);
	}
}
