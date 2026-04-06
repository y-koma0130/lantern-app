import { DeliveryPage } from "@/features/settings/components/delivery-page";

interface PageProps {
	params: Promise<{ orgSlug: string }>;
}

export default async function Page({ params }: PageProps) {
	const { orgSlug } = await params;

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-[#172B4D]">Delivery Settings</h2>
				<p className="mt-1 text-sm text-[#505F79]">
					Configure how and when you receive competitive intelligence reports.
				</p>
			</div>
			<DeliveryPage orgSlug={orgSlug} />
		</div>
	);
}
