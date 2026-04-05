import { LoginForm } from "@/features/auth/components/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Sign in — Lantern",
};

export default function LoginPage() {
	return (
		<div>
			<div className="mb-8 text-center">
				<h1 className="text-2xl font-bold text-[var(--color-foreground)]">Sign in to Lantern</h1>
				<p className="mt-2 text-sm text-gray-500">Competitive intelligence for cybersecurity</p>
			</div>
			<LoginForm />
		</div>
	);
}
