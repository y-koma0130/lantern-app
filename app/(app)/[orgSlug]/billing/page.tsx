import { BillingPage } from "@/features/billing/components/billing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Billing — Lantern",
};

interface PageProps {
	params: Promise<{ orgSlug: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ params, searchParams }: PageProps) {
	const { orgSlug } = await params;
	const search = await searchParams;

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-[#172B4D]">Billing</h2>
				<p className="mt-1 text-sm text-[#505F79]">Manage your subscription and billing.</p>
			</div>
			<BillingPage
				orgSlug={orgSlug}
				success={search.success === "true"}
				canceled={search.canceled === "true"}
			/>
		</div>
	);
}
