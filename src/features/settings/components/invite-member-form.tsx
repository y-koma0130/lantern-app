"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface InviteMemberFormProps {
	orgId: string;
}

export function InviteMemberForm({ orgId }: InviteMemberFormProps) {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<"member" | "owner">("member");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setSuccess(false);
		setLoading(true);

		try {
			const res = await fetch("/api/invitations", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orgId, email, role }),
			});

			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				setError(data.error ?? "Failed to send invitation");
				setLoading(false);
				return;
			}

			setEmail("");
			setRole("member");
			setSuccess(true);
			router.refresh();
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	const inputClass =
		"w-full rounded-[3px] border border-[#DFE1E6] px-3 py-2 text-sm text-[#172B4D] shadow-sm focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] focus:outline-none h-9";

	return (
		<div className="rounded-[3px] border border-[#DFE1E6] bg-white p-4">
			<h3 className="mb-4 text-sm font-semibold text-[#172B4D]">Invite Member</h3>

			{error && (
				<div className="mb-4 rounded-[3px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
					{error}
				</div>
			)}

			{success && (
				<div className="mb-4 rounded-[3px] border border-green-200 bg-green-50 p-3 text-sm text-green-700">
					Invitation sent successfully.
				</div>
			)}

			<form onSubmit={handleSubmit} className="flex items-end gap-3">
				<div className="flex-1">
					<label htmlFor="invite-email" className="mb-1 block text-sm font-medium text-[#172B4D]">
						Email address
					</label>
					<input
						id="invite-email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className={inputClass}
						placeholder="colleague@example.com"
					/>
				</div>

				<div className="w-32">
					<label htmlFor="invite-role" className="mb-1 block text-sm font-medium text-[#172B4D]">
						Role
					</label>
					<select
						id="invite-role"
						value={role}
						onChange={(e) => setRole(e.target.value as "member" | "owner")}
						className={inputClass}
					>
						<option value="member">Member</option>
						<option value="owner">Owner</option>
					</select>
				</div>

				<button
					type="submit"
					disabled={loading || !email}
					className="cursor-pointer rounded-[3px] bg-[#0052CC] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0065FF] focus:ring-2 focus:ring-[#0052CC] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 h-9"
				>
					{loading ? "Sending..." : "Send Invite"}
				</button>
			</form>
		</div>
	);
}
