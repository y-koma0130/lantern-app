import { DigestDetail } from "@/features/dashboard/components/digest-detail";
import { getOrgContext } from "@/lib/queries/get-org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";

interface DigestDetailPageProps {
	orgSlug: string;
	digestId: string;
}

export async function DigestDetailPage({ orgSlug, digestId }: DigestDetailPageProps) {
	const { orgId } = await getOrgContext(orgSlug);
	const supabase = createAdminClient();

	const { data: digest } = await supabase
		.from("digests")
		.select("id, week_of, content_html, generated_at")
		.eq("id", digestId)
		.eq("org_id", orgId)
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
