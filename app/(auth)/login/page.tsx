import { Logo } from "@/components/logo";
import { LoginForm } from "@/features/auth/components/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Sign in — Lantern",
};

export default function LoginPage() {
	return (
		<div>
			<div className="mb-8 text-center">
				<Logo size="lg" className="justify-center" />
				<h1 className="mt-4 text-2xl font-bold text-text-primary">Sign in</h1>
				<p className="mt-2 text-sm text-text-secondary">
					Competitive intelligence for cybersecurity
				</p>
			</div>
			<LoginForm />
		</div>
	);
}
