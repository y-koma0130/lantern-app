import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailParams {
	to: string;
	subject: string;
	html: string;
}

export async function sendEmail(params: EmailParams): Promise<void> {
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
