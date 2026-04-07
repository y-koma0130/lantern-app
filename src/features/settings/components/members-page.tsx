import { InviteMemberForm } from "@/features/settings/components/invite-member-form";
import { MemberList } from "@/features/settings/components/member-list";
import { PendingInvitations } from "@/features/settings/components/pending-invitations";
import { getOrgContext } from "@/lib/queries/get-org-context";
import { createAdminClient } from "@/lib/supabase/admin";

interface MembersPageProps {
	orgSlug: string;
}

export async function MembersPage({ orgSlug }: MembersPageProps) {
	const { orgId, userId, isOwner } = await getOrgContext(orgSlug);

	const supabase = createAdminClient();

	const [membersResult, invitationsResult] = await Promise.all([
		supabase
			.from("organization_members")
			.select("id, user_id, role, created_at")
			.eq("org_id", orgId)
			.order("created_at", { ascending: true }),
		isOwner
			? supabase
					.from("invitations")
					.select("id, email, role, created_at, expires_at")
					.eq("org_id", orgId)
					.eq("status", "pending")
					.order("created_at", { ascending: false })
			: Promise.resolve({ data: [] }),
	]);

	const rawMembers = membersResult.data ?? [];

	// Fetch emails per member via admin API
	const emailMap = new Map<string, string>();
	await Promise.all(
		rawMembers.map(async (m) => {
			const { data } = await supabase.auth.admin.getUserById(m.user_id as string);
			if (data?.user?.email) emailMap.set(m.user_id as string, data.user.email);
		}),
	);

	const members = rawMembers.map((m) => ({
		id: m.id,
		userId: m.user_id,
		email: emailMap.get(m.user_id as string) ?? "",
		role: m.role,
		createdAt: m.created_at,
	}));

	const invitations = (invitationsResult.data ?? []) as {
		id: string;
		email: string;
		role: string;
		created_at: string;
		expires_at: string;
	}[];

	return (
		<>
			{isOwner && <InviteMemberForm orgId={orgId} />}
			<MemberList members={members} orgId={orgId} currentUserId={userId} isOwner={isOwner} />
			{isOwner && <PendingInvitations invitations={invitations} />}
		</>
	);
}
