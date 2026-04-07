"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Member {
	id: string;
	userId: string;
	email: string;
	role: string;
	createdAt: string;
}

interface MemberListProps {
	members: Member[];
	orgId: string;
	currentUserId: string;
	isOwner: boolean;
}

export function MemberList({ members, orgId, currentUserId, isOwner }: MemberListProps) {
	const router = useRouter();
	const [removingId, setRemovingId] = useState<string | null>(null);
	const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
	const [updatingId, setUpdatingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleRemove(userId: string) {
		setError(null);
		setRemovingId(userId);

		try {
			const res = await fetch(`/api/organizations/${orgId}/members`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId }),
			});

			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				setError(data.error ?? "Failed to remove member");
				setRemovingId(null);
				return;
			}

			setConfirmRemoveId(null);
			router.refresh();
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setRemovingId(null);
		}
	}

	async function handleRoleChange(userId: string, newRole: string) {
		setError(null);
		setUpdatingId(userId);

		try {
			const res = await fetch(`/api/organizations/${orgId}/members`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId, role: newRole }),
			});

			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				setError(data.error ?? "Failed to update role");
				setUpdatingId(null);
				return;
			}

			router.refresh();
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setUpdatingId(null);
		}
	}

	if (members.length === 0) {
		return (
			<div className="rounded-[3px] border border-border bg-white p-8 text-center">
				<p className="text-sm text-text-secondary">No members found.</p>
			</div>
		);
	}

	return (
		<div>
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
								Joined
							</th>
							{isOwner && (
								<th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
									Actions
								</th>
							)}
						</tr>
					</thead>
					<tbody>
						{members.map((member, index) => {
							const isSelf = member.userId === currentUserId;

							return (
								<tr key={member.id} className={index % 2 === 0 ? "bg-white" : "bg-surface-subtle"}>
									<td className="px-4 py-3 text-sm text-text-primary">
										{member.email}
										{isSelf && (
											<span className="ml-2 rounded-[3px] bg-brand-light px-1.5 py-0.5 text-xs font-medium text-brand">
												You
											</span>
										)}
									</td>
									<td className="px-4 py-3 text-sm text-text-secondary">
										{isOwner && !isSelf ? (
											<select
												value={member.role}
												onChange={(e) => handleRoleChange(member.userId, e.target.value)}
												disabled={updatingId === member.userId}
												className="rounded-[3px] border border-border bg-white px-2 py-1 text-xs text-text-primary focus:border-border-focus focus:ring-1 focus:ring-brand focus:outline-none disabled:opacity-50"
											>
												<option value="owner">Owner</option>
												<option value="member">Member</option>
											</select>
										) : (
											<span className="inline-flex items-center rounded-[3px] bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-secondary capitalize">
												{member.role}
											</span>
										)}
									</td>
									<td className="px-4 py-3 text-sm text-text-secondary">
										{new Date(member.createdAt).toLocaleDateString()}
									</td>
									{isOwner && (
										<td className="px-4 py-3 text-right">
											{isSelf ? (
												<span className="text-xs text-text-disabled">--</span>
											) : confirmRemoveId === member.userId ? (
												<span className="inline-flex items-center gap-2">
													<span className="text-xs text-text-secondary">Remove?</span>
													<button
														type="button"
														onClick={() => handleRemove(member.userId)}
														disabled={removingId === member.userId}
														className="cursor-pointer rounded-[3px] bg-error px-2 py-1 text-xs font-medium text-white hover:bg-error-hover disabled:opacity-50"
													>
														{removingId === member.userId ? "..." : "Yes"}
													</button>
													<button
														type="button"
														onClick={() => setConfirmRemoveId(null)}
														className="cursor-pointer rounded-[3px] border border-border bg-white px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface-subtle"
													>
														No
													</button>
												</span>
											) : (
												<button
													type="button"
													onClick={() => setConfirmRemoveId(member.userId)}
													className="cursor-pointer rounded-[3px] border border-border bg-white px-3 py-1 text-xs font-medium text-error hover:bg-error-bg"
												>
													Remove
												</button>
											)}
										</td>
									)}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
