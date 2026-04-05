"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface AddCompetitorFormProps {
	orgId: string;
}

const nicheOptions = [
	"Endpoint Security",
	"Network Security",
	"Cloud Security",
	"Identity & Access Management",
	"SIEM / SOAR",
	"Vulnerability Management",
	"Email Security",
	"Application Security",
	"Data Security",
	"Threat Intelligence",
	"GRC",
	"Other",
] as const;

export function AddCompetitorForm({ orgId }: AddCompetitorFormProps) {
	const router = useRouter();
	const [name, setName] = useState("");
	const [website, setWebsite] = useState("");
	const [g2Url, setG2Url] = useState("");
	const [niche, setNiche] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setSuccess(false);
		setLoading(true);

		try {
			const res = await fetch(`/api/organizations/${orgId}/competitors`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					website,
					g2Url: g2Url || null,
					niche,
				}),
			});

			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				setError(data.error ?? "Failed to add competitor");
				setLoading(false);
				return;
			}

			setName("");
			setWebsite("");
			setG2Url("");
			setNiche("");
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
			<h3 className="mb-4 text-sm font-semibold text-[#172B4D]">Add Competitor</h3>

			{error && (
				<div className="mb-4 rounded-[3px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
					{error}
				</div>
			)}

			{success && (
				<div className="mb-4 rounded-[3px] border border-green-200 bg-green-50 p-3 text-sm text-green-700">
					Competitor added successfully.
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label
							htmlFor="competitor-name"
							className="mb-1 block text-sm font-medium text-[#172B4D]"
						>
							Name
						</label>
						<input
							id="competitor-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							className={inputClass}
							placeholder="CrowdStrike"
						/>
					</div>

					<div>
						<label
							htmlFor="competitor-website"
							className="mb-1 block text-sm font-medium text-[#172B4D]"
						>
							Website
						</label>
						<input
							id="competitor-website"
							type="url"
							value={website}
							onChange={(e) => setWebsite(e.target.value)}
							required
							className={inputClass}
							placeholder="https://crowdstrike.com"
						/>
					</div>

					<div>
						<label
							htmlFor="competitor-g2url"
							className="mb-1 block text-sm font-medium text-[#172B4D]"
						>
							G2 URL
							<span className="ml-1 text-xs font-normal text-[#505F79]">(optional)</span>
						</label>
						<input
							id="competitor-g2url"
							type="url"
							value={g2Url}
							onChange={(e) => setG2Url(e.target.value)}
							className={inputClass}
							placeholder="https://www.g2.com/products/..."
						/>
					</div>

					<div>
						<label
							htmlFor="competitor-niche"
							className="mb-1 block text-sm font-medium text-[#172B4D]"
						>
							Niche
						</label>
						<select
							id="competitor-niche"
							value={niche}
							onChange={(e) => setNiche(e.target.value)}
							required
							className={inputClass}
						>
							<option value="" disabled>
								Select a niche...
							</option>
							{nicheOptions.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="flex justify-end">
					<button
						type="submit"
						disabled={loading || !name || !website || !niche}
						className="cursor-pointer rounded-[3px] bg-[#0052CC] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0065FF] focus:ring-2 focus:ring-[#0052CC] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						{loading ? "Adding..." : "Add Competitor"}
					</button>
				</div>
			</form>
		</div>
	);
}
