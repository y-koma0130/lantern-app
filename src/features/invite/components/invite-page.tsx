import { AcceptInvitation } from "@/features/invite/components/accept-invitation";
import { createAdminClient } from "@/lib/supabase/admin";

interface InvitePageProps {
	token: string;
}

export async function InvitePage({ token }: InvitePageProps) {
	const supabase = createAdminClient();

	// Fetch invitation by token — org_id is a FK so organizations is a single object
	const { data: invitation } = await supabase
		.from("invitations")
		.select("id, email, role, status, expires_at, token, organizations!inner(id, name, slug)")
		.eq("token", token)
		.single();

	const isExpired = invitation?.expires_at ? new Date(invitation.expires_at) < new Date() : false;

	const isValid = invitation && invitation.status === "pending" && !isExpired;

	return (
		<div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
			<div className="w-full max-w-sm">
				{!invitation && (
					<div className="text-center">
						<div className="mb-4 text-4xl">
							<span role="img" aria-label="not found">
								&#x26A0;
							</span>
						</div>
						<h1 className="text-2xl font-bold text-text-primary">Invitation Not Found</h1>
						<p className="mt-2 text-sm text-text-secondary">
							This invitation link is invalid or has been removed.
						</p>
					</div>
				)}

				{invitation && !isValid && (
					<div className="text-center">
						<div className="mb-4 text-4xl">
							<span role="img" aria-label="expired">
								&#x23F0;
							</span>
						</div>
						<h1 className="text-2xl font-bold text-text-primary">
							{invitation.status === "accepted"
								? "Already Accepted"
								: invitation.status === "revoked"
									? "Invitation Revoked"
									: isExpired
										? "Invitation Expired"
										: "Invalid Invitation"}
						</h1>
						<p className="mt-2 text-sm text-text-secondary">
							{invitation.status === "accepted"
								? "This invitation has already been accepted."
								: invitation.status === "revoked"
									? "This invitation has been revoked by the organization owner."
									: isExpired
										? "This invitation has expired. Please ask the organization owner to send a new one."
										: "This invitation is no longer valid."}
						</p>
					</div>
				)}

				{invitation && isValid && (
					<div className="text-center">
						<div className="mb-8">
							<h1 className="text-2xl font-bold text-text-primary">
								Join{" "}
								{
									(
										invitation.organizations as unknown as {
											id: string;
											name: string;
											slug: string;
										} | null
									)?.name
								}
							</h1>
							<p className="mt-2 text-sm text-text-secondary">
								You&apos;ve been invited to join as a {invitation.role}
							</p>
						</div>
						<AcceptInvitation
							token={invitation.token}
							email={invitation.email}
							orgName={
								(
									invitation.organizations as unknown as {
										id: string;
										name: string;
										slug: string;
									} | null
								)?.name ?? "this organization"
							}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
