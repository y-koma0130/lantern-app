"use client";

import { COMPETITORS_CATALOG } from "@/lib/competitors-catalog";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface AddCompetitorFormProps {
	orgId: string;
	orgSlug: string;
	existingCompetitorNames: string[];
}

export function AddCompetitorForm({
	orgId,
	orgSlug,
	existingCompetitorNames,
}: AddCompetitorFormProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [showRequestModal, setShowRequestModal] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const existingSet = new Set(existingCompetitorNames.map((n) => n.toLowerCase()));
	const availableCompetitors = COMPETITORS_CATALOG.filter(
		(c) => !existingSet.has(c.name.toLowerCase()),
	);
	const filtered = search
		? availableCompetitors.filter(
				(c) =>
					c.name.toLowerCase().includes(search.toLowerCase()) ||
					c.niche.toLowerCase().includes(search.toLowerCase()),
			)
		: availableCompetitors;

	const niches = [...new Set(filtered.map((c) => c.niche))];

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	async function handleSelect(name: string) {
		const competitor = COMPETITORS_CATALOG.find((c) => c.name === name);
		if (!competitor) return;

		setOpen(false);
		setSearch("");
		setError(null);
		setSuccess(null);
		setLoading(name);

		try {
			const res = await fetch(`/api/organizations/${orgId}/competitors`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: competitor.name,
					website: competitor.website,
					niche: competitor.niche,
					g2Url: competitor.g2Url ?? null,
				}),
			});

			if (!res.ok) {
				const data = (await res.json()) as { error?: string; code?: string };
				if (data.code === "COMPETITOR_LIMIT_REACHED") {
					setError("limit");
				} else {
					setError(data.error ?? "Failed to add competitor");
				}
				return;
			}

			setSuccess(`${competitor.name} added.`);
			router.refresh();
		} catch {
			setError("Something went wrong.");
		} finally {
			setLoading(null);
		}
	}

	return (
		<div className="rounded-[3px] border border-border bg-white p-4">
			<h3 className="mb-3 text-sm font-semibold text-text-primary">Add Competitor</h3>

			{error && error !== "limit" && (
				<div className="mb-3 rounded-[3px] border border-error-bg bg-error-bg p-2 text-xs text-error-text">
					{error}
				</div>
			)}
			{error === "limit" && (
				<div className="mb-3 rounded-[3px] border border-warning bg-warning-bg p-3">
					<p className="text-sm font-medium text-text-primary">Competitor limit reached</p>
					<p className="mt-1 text-xs text-text-secondary">
						You&apos;ve reached the maximum number of competitors for your current plan. Upgrade to
						track more.
					</p>
					<a
						href={`/${orgSlug}/billing`}
						className="mt-2 inline-block rounded-[3px] bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover"
					>
						View Plans
					</a>
				</div>
			)}
			{success && (
				<div className="mb-3 rounded-[3px] border border-success-bg bg-success-bg p-2 text-xs text-success-text">
					{success}
				</div>
			)}

			<div ref={ref} className="relative">
				<button
					type="button"
					onClick={() => setOpen(!open)}
					disabled={loading !== null}
					className="flex w-full cursor-pointer items-center justify-between rounded-[3px] border border-border bg-white px-3 py-2 text-sm text-text-primary hover:bg-surface-hover disabled:opacity-50"
				>
					<span className={loading ? "text-text-secondary" : "text-text-tertiary"}>
						{loading ? `Adding ${loading}...` : "Choose a competitor to track..."}
					</span>
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						aria-hidden="true"
						className={`transition-transform ${open ? "rotate-180" : ""}`}
					>
						<path
							d="M4 6L8 10L12 6"
							stroke="#505F79"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>

				{open && (
					<div className="absolute top-full left-0 z-50 mt-1 w-full rounded-[3px] border border-border bg-white shadow-lg">
						<div className="border-b border-border p-2">
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search competitors..."
								className="w-full rounded-[3px] border border-border px-2 py-1.5 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-brand"
							/>
						</div>

						<div className="max-h-64 overflow-y-auto py-1">
							{niches.map((niche) => {
								const nicheCompetitors = filtered.filter((c) => c.niche === niche);
								if (nicheCompetitors.length === 0) return null;
								return (
									<div key={niche}>
										<div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
											{niche}
										</div>
										{nicheCompetitors.map((c) => (
											<button
												key={c.name}
												type="button"
												onClick={() => handleSelect(c.name)}
												className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm text-text-primary hover:bg-surface-hover"
											>
												<span>{c.name}</span>
												<span className="ml-auto text-xs text-text-tertiary">
													{new URL(c.website).hostname}
												</span>
											</button>
										))}
									</div>
								);
							})}

							{filtered.length === 0 && (
								<p className="px-3 py-2 text-xs text-text-tertiary">No competitors found.</p>
							)}
						</div>

						<div className="border-t border-border">
							<button
								type="button"
								onClick={() => {
									setOpen(false);
									setShowRequestModal(true);
								}}
								className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-brand hover:bg-surface-hover"
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
									<path
										d="M8 3V13M3 8H13"
										stroke="#06b6d4"
										strokeWidth="1.5"
										strokeLinecap="round"
									/>
								</svg>
								<span>Request a new competitor</span>
							</button>
						</div>
					</div>
				)}
			</div>

			{showRequestModal && (
				<RequestCompetitorModal orgId={orgId} onClose={() => setShowRequestModal(false)} />
			)}
		</div>
	);
}

interface RequestModalProps {
	orgId: string;
	onClose: () => void;
}

function RequestCompetitorModal({ orgId, onClose }: RequestModalProps) {
	const [serviceName, setServiceName] = useState("");
	const [serviceUrl, setServiceUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setResult(null);

		try {
			const res = await fetch("/api/competitor-requests", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orgId, serviceName, serviceUrl }),
			});

			if (res.ok) {
				setResult({
					success: true,
					message: "Request submitted! We'll review and get back to you.",
				});
				setServiceName("");
				setServiceUrl("");
			} else {
				const data = (await res.json()) as { error?: string };
				setResult({ success: false, message: data.error ?? "Failed to submit request" });
			}
		} catch {
			setResult({ success: false, message: "Something went wrong." });
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
			<div className="mx-4 w-full max-w-md rounded-[3px] border border-border bg-white p-6 shadow-xl">
				<h3 className="mb-1 text-base font-semibold text-text-primary">Request a Competitor</h3>
				<p className="mb-4 text-xs text-text-secondary">
					We&apos;ll verify the service and add it to the catalog if it qualifies.
				</p>

				{result && (
					<div
						className={`mb-4 rounded-[3px] border p-3 text-sm ${
							result.success
								? "border-success-bg bg-success-bg text-success-text"
								: "border-error-bg bg-error-bg text-error-text"
						}`}
					>
						{result.message}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="request-name"
							className="mb-1 block text-sm font-medium text-text-primary"
						>
							Service name
						</label>
						<input
							id="request-name"
							type="text"
							value={serviceName}
							onChange={(e) => setServiceName(e.target.value)}
							required
							placeholder="e.g. Rapid7"
							className="h-9 w-full rounded-[3px] border border-border px-3 py-2 text-sm text-text-primary shadow-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-brand"
						/>
					</div>

					<div>
						<label
							htmlFor="request-url"
							className="mb-1 block text-sm font-medium text-text-primary"
						>
							Website URL
						</label>
						<input
							id="request-url"
							type="url"
							value={serviceUrl}
							onChange={(e) => setServiceUrl(e.target.value)}
							required
							placeholder="https://www.rapid7.com"
							className="h-9 w-full rounded-[3px] border border-border px-3 py-2 text-sm text-text-primary shadow-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-brand"
						/>
					</div>

					<div className="flex justify-end gap-2">
						<button
							type="button"
							onClick={onClose}
							className="cursor-pointer rounded-[3px] border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover"
						>
							{result?.success ? "Close" : "Cancel"}
						</button>
						{!result?.success && (
							<button
								type="submit"
								disabled={loading || !serviceName || !serviceUrl}
								className="cursor-pointer rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
							>
								{loading ? "Submitting..." : "Submit Request"}
							</button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}
