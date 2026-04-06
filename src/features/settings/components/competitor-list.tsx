"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Competitor {
	id: string;
	name: string;
	website: string;
	g2_url: string | null;
	niche: string;
}

interface CompetitorListProps {
	competitors: Competitor[];
	orgId: string;
	isOwner: boolean;
}

export function CompetitorList({ competitors, orgId, isOwner }: CompetitorListProps) {
	const router = useRouter();
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [confirmId, setConfirmId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleDelete(competitorId: string) {
		setError(null);
		setDeletingId(competitorId);

		try {
			const res = await fetch(`/api/organizations/${orgId}/competitors`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ competitorId }),
			});

			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				setError(data.error ?? "Failed to delete competitor");
				setDeletingId(null);
				return;
			}

			setConfirmId(null);
			router.refresh();
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setDeletingId(null);
		}
	}

	if (competitors.length === 0) {
		return (
			<div className="rounded-[3px] border border-border bg-white p-8 text-center">
				<p className="text-sm text-text-secondary">
					No competitors added yet. Add your first competitor to start tracking.
				</p>
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
								Name
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
								Website
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
								Niche
							</th>
							{isOwner && (
								<th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
									Actions
								</th>
							)}
						</tr>
					</thead>
					<tbody>
						{competitors.map((competitor, index) => (
							<tr
								key={competitor.id}
								className={index % 2 === 0 ? "bg-white" : "bg-surface-subtle"}
							>
								<td className="px-4 py-3 text-sm font-medium text-text-primary">
									{competitor.name}
								</td>
								<td className="px-4 py-3 text-sm text-text-secondary">
									<a
										href={competitor.website}
										target="_blank"
										rel="noopener noreferrer"
										className="text-brand hover:underline"
									>
										{competitor.website}
									</a>
								</td>
								<td className="px-4 py-3 text-sm text-text-secondary">{competitor.niche}</td>
								{isOwner && (
									<td className="px-4 py-3 text-right">
										{confirmId === competitor.id ? (
											<span className="inline-flex items-center gap-2">
												<span className="text-xs text-text-secondary">Delete?</span>
												<button
													type="button"
													onClick={() => handleDelete(competitor.id)}
													disabled={deletingId === competitor.id}
													className="cursor-pointer rounded-[3px] bg-error px-2 py-1 text-xs font-medium text-white hover:bg-error-hover disabled:opacity-50"
												>
													{deletingId === competitor.id ? "..." : "Yes"}
												</button>
												<button
													type="button"
													onClick={() => setConfirmId(null)}
													className="cursor-pointer rounded-[3px] border border-border bg-white px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface-subtle"
												>
													No
												</button>
											</span>
										) : (
											<button
												type="button"
												onClick={() => setConfirmId(competitor.id)}
												className="cursor-pointer rounded-[3px] border border-border bg-white px-3 py-1 text-xs font-medium text-error hover:bg-error-bg"
											>
												Delete
											</button>
										)}
									</td>
								)}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
