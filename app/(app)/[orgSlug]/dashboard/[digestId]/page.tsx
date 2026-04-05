import { DigestDetail } from "@/features/dashboard/components/digest-detail";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

interface DigestDetailPageProps {
	params: Promise<{ orgSlug: string; digestId: string }>;
}

export default async function DigestDetailPage({ params }: DigestDetailPageProps) {
	const { orgSlug, digestId } = await params;
	const supabase = await createClient();

	// Fetch the org to validate access
	const { data: org } = await supabase
		.from("organizations")
		.select("id")
		.eq("slug", orgSlug)
		.single();

	if (!org) {
		notFound();
	}

	// Fetch the digest
	const { data: digest } = await supabase
		.from("digests")
		.select("id, week_of, content_html, generated_at")
		.eq("id", digestId)
		.eq("org_id", org.id)
		.single();

	if (!digest) {
		notFound();
	}

	return (
		<div className="min-h-full bg-[#FAFBFC]">
			<div className="mx-auto max-w-4xl px-6 py-8">
				<Link
					href={`/${orgSlug}/dashboard`}
					className="mb-6 inline-flex items-center gap-1 text-sm text-[#0052CC] hover:underline"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<path
							d="M10 4L6 8L10 12"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					Back to Dashboard
				</Link>
				<DigestDetail
					weekOf={digest.week_of}
					generatedAt={digest.generated_at}
					contentHtml={digest.content_html}
				/>
			</div>
		</div>
	);
}
