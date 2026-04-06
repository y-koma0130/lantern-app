import { DashboardPage } from "@/features/dashboard/components/dashboard-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Dashboard — Lantern",
};

interface PageProps {
	params: Promise<{ orgSlug: string }>;
}

export default async function Page({ params }: PageProps) {
	const { orgSlug } = await params;

	return (
		<div className="min-h-full bg-[#FAFBFC]">
			<div className="mx-auto max-w-4xl px-6 py-8">
				<h1 className="mb-6 text-xl font-semibold text-[#172B4D]">Dashboard</h1>
				<DashboardPage orgSlug={orgSlug} />
			</div>
		</div>
	);
}
