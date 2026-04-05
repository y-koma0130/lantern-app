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
			<h3 className="mb-3 text-sm font-semibold text-[#172B4D]">Pending Invitations</h3>

			{error && (
				<div className="mb-4 rounded-[3px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
					{error}
				</div>
			)}

			<div className="overflow-hidden rounded-[3px] border border-[#DFE1E6]">
				<table className="w-full">
					<thead>
						<tr className="bg-[#FAFBFC]">
							<th className="px-4 py-3 text-left text-xs font-semibold text-[#505F79] uppercase tracking-wider">
								Email
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold text-[#505F79] uppercase tracking-wider">
								Role
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold text-[#505F79] uppercase tracking-wider">
								Expires
							</th>
							<th className="px-4 py-3 text-right text-xs font-semibold text-[#505F79] uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody>
						{invitations.map((invitation, index) => (
							<tr key={invitation.id} className={index % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}>
								<td className="px-4 py-3 text-sm text-[#172B4D]">{invitation.email}</td>
								<td className="px-4 py-3 text-sm text-[#505F79] capitalize">{invitation.role}</td>
								<td className="px-4 py-3 text-sm text-[#505F79]">
									{new Date(invitation.expires_at).toLocaleDateString()}
								</td>
								<td className="px-4 py-3 text-right">
									<button
										type="button"
										onClick={() => handleRevoke(invitation.id)}
										disabled={revokingId === invitation.id}
										className="cursor-pointer rounded-[3px] border border-[#DFE1E6] bg-white px-3 py-1 text-xs font-medium text-[#FF5630] hover:bg-red-50 disabled:opacity-50"
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
