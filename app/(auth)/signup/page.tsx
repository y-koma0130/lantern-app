import { SignupForm } from "@/features/auth/components/signup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Create account — Lantern",
};

export default function SignupPage() {
	return (
		<div>
			<div className="mb-8 text-center">
				<h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
				<p className="mt-2 text-sm text-text-secondary">Get started with Lantern</p>
			</div>
			<SignupForm />
		</div>
	);
}
