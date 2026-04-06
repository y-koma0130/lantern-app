"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Invitation {
	id: string;
	email: string;
	role: string;
	created_at: string;
	expires_at: string;
}

interface PendingInvitationsProps {
	invitations: Invitation[];
}

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
	const router = useRouter();
	const [revokingId, setRevokingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleRevoke(invitationId: string) {
		setError(null);
		setRevokingId(invitationId);

		try {
			const res = await fetch(`/api/invitations/${invitationId}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				setError(data.error ?? "Failed to revoke invitation");
				setRevokingId(null);
				return;
			}

			router.refresh();
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setRevokingId(null);
		}
	}

	if (invitations.length === 0) {
		return null;
	}

	return (
		<div>
			<h3 className="mb-3 text-sm font-semibold text-text-primary">Pending Invitations</h3>

			{error && (
				<div className="mb-4 rounded-[3px] border border-error-bg bg-error-bg p-3 text-sm text-error-text">
					{error}
				</div>
			)}

			<div className="overflow-hidden rounded-[3px] border border-border">
				<table className="w-full">
					<thead>
						<tr className="bg-surface-subtle">
							<th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
								Email
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
								Role
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
								Expires
							</th>
							<th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody>
						{invitations.map((invitation, index) => (
							<tr
								key={invitation.id}
								className={index % 2 === 0 ? "bg-white" : "bg-surface-subtle"}
							>
								<td className="px-4 py-3 text-sm text-text-primary">{invitation.email}</td>
								<td className="px-4 py-3 text-sm text-text-secondary capitalize">
									{invitation.role}
								</td>
								<td className="px-4 py-3 text-sm text-text-secondary">
									{new Date(invitation.expires_at).toLocaleDateString()}
								</td>
								<td className="px-4 py-3 text-right">
									<button
										type="button"
										onClick={() => handleRevoke(invitation.id)}
										disabled={revokingId === invitation.id}
										className="cursor-pointer rounded-[3px] border border-border bg-white px-3 py-1 text-xs font-medium text-error hover:bg-error-bg disabled:opacity-50"
									>
										{revokingId === invitation.id ? "Revoking..." : "Revoke"}
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
