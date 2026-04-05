import { Header } from "@/features/layout/components/header";
import { Sidebar } from "@/features/layout/components/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

interface AppLayoutProps {
	children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const { data: memberships } = await supabase
		.from("organization_members")
		.select("role, organizations(*)")
		.eq("user_id", user.id);

	const orgs = (memberships ?? []).map((m) => {
		const org = m.organizations as unknown as {
			id: string;
			name: string;
			slug: string;
			plan: string;
		};
		return { ...org, role: m.role as string };
	});

	if (orgs.length === 0) {
		redirect("/onboarding");
	}

	return (
		<div className="flex h-screen flex-col bg-[#FAFBFC]">
			<Header
				user={{ email: user.email ?? "" }}
				orgs={orgs.map((o) => ({ id: o.id, name: o.name, slug: o.slug }))}
			/>
			<div className="flex flex-1 overflow-hidden">
				<Sidebar orgs={orgs.map((o) => ({ id: o.id, name: o.name, slug: o.slug }))} />
				<main className="flex-1 overflow-y-auto p-8">{children}</main>
			</div>
		</div>
	);
}
