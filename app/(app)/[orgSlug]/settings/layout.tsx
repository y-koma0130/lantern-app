import { SettingsNav } from "@/features/settings/components/settings-nav";
import type { ReactNode } from "react";

interface SettingsLayoutProps {
	children: ReactNode;
	params: Promise<{ orgSlug: string }>;
}

export default async function SettingsLayout({ children, params }: SettingsLayoutProps) {
	const { orgSlug } = await params;

	return (
		<div className="mx-auto max-w-4xl px-6 py-8">
			<h1 className="mb-6 text-2xl font-bold text-[#172B4D]">Settings</h1>
			<SettingsNav orgSlug={orgSlug} />
			<div className="mt-6">{children}</div>
		</div>
	);
}
