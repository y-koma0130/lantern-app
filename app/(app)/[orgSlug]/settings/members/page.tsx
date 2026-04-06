import { MembersPage } from "@/features/settings/components/members-page";

interface PageProps {
	params: Promise<{ orgSlug: string }>;
}

export default async function Page({ params }: PageProps) {
	const { orgSlug } = await params;

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-[#172B4D]">Members</h2>
				<p className="mt-1 text-sm text-[#505F79]">
					Manage your organization members and invitations.
				</p>
			</div>
			<MembersPage orgSlug={orgSlug} />
		</div>
	);
}
