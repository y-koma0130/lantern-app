"use client";

import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrgSwitcher } from "./org-switcher";

interface HeaderProps {
	user: { email: string };
	orgs: { id: string; name: string; slug: string }[];
}

export function Header({ user, orgs }: HeaderProps) {
	const router = useRouter();
	const [loggingOut, setLoggingOut] = useState(false);

	async function handleLogout() {
		setLoggingOut(true);
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/login");
	}

	return (
		<header className="flex h-14 shrink-0 items-center border-b border-border bg-white px-4">
			<div className="flex items-center gap-3">
				<Logo size="sm" />
			</div>

			<div className="ml-6">
				<OrgSwitcher orgs={orgs} />
			</div>

			<div className="ml-auto flex items-center gap-4">
				<span className="text-sm text-text-secondary">{user.email}</span>
				<button
					type="button"
					onClick={handleLogout}
					disabled={loggingOut}
					className="cursor-pointer rounded-[3px] border border-border bg-white px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
				>
					{loggingOut ? "Signing out..." : "Sign out"}
				</button>
			</div>
		</header>
	);
}
