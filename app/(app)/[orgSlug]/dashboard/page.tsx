import { DashboardPage } from "@/features/dashboard/components/dashboard-page";
import { ExportButtons } from "@/features/dashboard/components/export-buttons";
import { getOrgContext } from "@/lib/queries/get-org-context";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Dashboard — Lantern",
};

interface PageProps {
	params: Promise<{ orgSlug: string }>;
}

export default async function Page({ params }: PageProps) {
	const { orgSlug } = await params;
	const { orgId, orgPlan } = await getOrgContext(orgSlug);

	return (
		<div className="min-h-full bg-surface-subtle">
			<div className="mx-auto max-w-4xl px-6 py-8">
				<div className="mb-6 flex items-center justify-between">
					<h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
					<ExportButtons orgId={orgId} canExport={orgPlan === "pro" || orgPlan === "team"} />
				</div>
				<DashboardPage orgId={orgId} orgSlug={orgSlug} orgPlan={orgPlan} />
			</div>
		</div>
	);
}
