import { CompetitorsPage } from "@/features/settings/components/competitors-page";

interface PageProps {
	params: Promise<{ orgSlug: string }>;
}

export default async function Page({ params }: PageProps) {
	const { orgSlug } = await params;

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-text-primary">Competitors</h2>
				<p className="mt-1 text-sm text-text-secondary">
					Manage the competitors your organization is tracking.
				</p>
			</div>
			<CompetitorsPage orgSlug={orgSlug} />
		</div>
	);
}
