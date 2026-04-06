"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupForm() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			setLoading(false);
			return;
		}

		if (password.length < 8) {
			setError("Password must be at least 8 characters.");
			setLoading(false);
			return;
		}

		const supabase = createClient();
		const { error: signUpError } = await supabase.auth.signUp({
			email,
			password,
		});

		if (signUpError) {
			setError(signUpError.message);
			setLoading(false);
			return;
		}

		router.push("/");
	}

	const inputClass =
		"w-full rounded-[3px] border border-border px-3 py-2 text-sm text-text-primary shadow-sm focus:border-border-focus focus:ring-1 focus:ring-brand focus:outline-none h-9";

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{error && (
				<div className="rounded-[3px] border border-error-bg bg-error-bg p-3 text-sm text-error-text">
					{error}
				</div>
			)}

			<div>
				<label htmlFor="email" className="mb-1 block text-sm font-medium text-text-primary">
					Email
				</label>
				<input
					id="email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					autoComplete="email"
					className={inputClass}
					placeholder="you@example.com"
				/>
			</div>

			<div>
				<label htmlFor="password" className="mb-1 block text-sm font-medium text-text-primary">
					Password
				</label>
				<input
					id="password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					autoComplete="new-password"
					className={inputClass}
					placeholder="At least 8 characters"
				/>
			</div>

			<div>
				<label
					htmlFor="confirm-password"
					className="mb-1 block text-sm font-medium text-text-primary"
				>
					Confirm password
				</label>
				<input
					id="confirm-password"
					type="password"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					required
					autoComplete="new-password"
					className={inputClass}
					placeholder="Repeat your password"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full cursor-pointer rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-hover focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				{loading ? "Creating account..." : "Create account"}
			</button>

			<p className="text-center text-sm text-text-secondary">
				Already have an account?{" "}
				<Link href="/login" className="font-medium text-brand hover:underline">
					Sign in
				</Link>
			</p>
		</form>
	);
}
