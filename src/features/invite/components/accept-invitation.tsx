"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface AcceptInvitationProps {
	token: string;
	email: string;
	orgName: string;
}

type AuthState = "loading" | "unauthenticated" | "email-mismatch" | "ready";

export function AcceptInvitation({ token, email, orgName }: AcceptInvitationProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [authState, setAuthState] = useState<AuthState>("loading");
	const [accepting, setAccepting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function checkAuth() {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) {
				setAuthState("unauthenticated");
			} else if (user.email !== email) {
				setAuthState("email-mismatch");
			} else {
				setAuthState("ready");
			}
		}

		checkAuth();
	}, [email]);

	const handleAccept = useCallback(async () => {
		setAccepting(true);
		setError(null);

		try {
			const response = await fetch("/api/invitations/accept", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token }),
			});

			const data = (await response.json()) as {
				error?: string;
				organization?: { slug?: string };
			};

			if (!response.ok) {
				setError(data.error ?? "Failed to accept invitation");
				setAccepting(false);
				return;
			}

			const slug = data.organization?.slug;
			router.push(slug ? `/${slug}` : "/");
			router.refresh();
		} catch {
			setError("An unexpected error occurred");
			setAccepting(false);
		}
	}, [token, router]);

	if (authState === "loading") {
		return <div className="py-4 text-sm text-gray-500">Checking authentication...</div>;
	}

	if (authState === "unauthenticated") {
		const nextParam = encodeURIComponent(pathname);
		return (
			<div className="space-y-3">
				<p className="text-sm text-gray-500">
					Sign in or create an account to accept this invitation.
				</p>
				<div className="flex flex-col gap-2">
					<Link
						href={`/login?next=${nextParam}`}
						className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white shadow-sm hover:bg-blue-700"
					>
						Sign in
					</Link>
					<Link
						href={`/signup?next=${nextParam}`}
						className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-[var(--color-foreground)] shadow-sm hover:bg-gray-50"
					>
						Create account
					</Link>
				</div>
			</div>
		);
	}

	if (authState === "email-mismatch") {
		return (
			<div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
				<p className="font-medium">Email mismatch</p>
				<p className="mt-1">
					This invitation was sent to <strong>{email}</strong>. Please sign in with that email
					address to accept it.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{error && (
				<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
					{error}
				</div>
			)}
			<button
				type="button"
				onClick={handleAccept}
				disabled={accepting}
				className="w-full cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				{accepting ? "Joining..." : `Accept & Join ${orgName}`}
			</button>
		</div>
	);
}
