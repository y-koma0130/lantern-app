import { DigestDetailPage } from "@/features/dashboard/components/digest-detail-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Digest — Lantern",
};

interface PageProps {
	params: Promise<{ orgSlug: string; digestId: string }>;
}

export default async function Page({ params }: PageProps) {
	const { orgSlug, digestId } = await params;

	return (
		<div className="min-h-full bg-[#FAFBFC]">
			<div className="mx-auto max-w-4xl px-6 py-8">
				<DigestDetailPage orgSlug={orgSlug} digestId={digestId} />
			</div>
		</div>
	);
}
