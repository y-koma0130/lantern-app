"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const supabase = createClient();
		const { error: signInError } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (signInError) {
			setError(signInError.message);
			setLoading(false);
			return;
		}

		router.push("/");
		router.refresh();
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
					autoComplete="current-password"
					className={inputClass}
					placeholder="Enter your password"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full cursor-pointer rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-hover focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				{loading ? "Signing in..." : "Sign in"}
			</button>

			<p className="text-center text-sm text-text-secondary">
				Don&apos;t have an account?{" "}
				<Link href="/signup" className="font-medium text-brand hover:underline">
					Create account
				</Link>
			</p>
		</form>
	);
}
