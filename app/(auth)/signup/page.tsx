import { Logo } from "@/components/logo";
import { SignupForm } from "@/features/auth/components/signup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Create account — Lantern",
};

export default function SignupPage() {
	return (
		<div>
			<div className="mb-8 text-center">
				<Logo size="lg" className="justify-center" />
					<h1 className="mt-4 text-2xl font-bold text-text-primary">Create your account</h1>
			</div>
			<SignupForm />
		</div>
	);
}
