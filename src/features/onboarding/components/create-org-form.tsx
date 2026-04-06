"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function CreateOrgForm() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugEdited, setSlugEdited] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	function handleNameChange(value: string) {
		setName(value);
		if (!slugEdited) {
			setSlug(slugify(value));
		}
	}

	function handleSlugChange(value: string) {
		setSlugEdited(true);
		setSlug(slugify(value));
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const res = await fetch("/api/organizations", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, slug }),
			});

			const data = (await res.json()) as { slug?: string; error?: string };

			if (!res.ok) {
				setError(data.error ?? "Failed to create organization");
				setLoading(false);
				return;
			}

			router.push(`/${data.slug}/dashboard`);
			router.refresh();
		} catch {
			setError("Something went wrong. Please try again.");
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{error && (
				<div className="rounded-[3px] border border-error-bg bg-error-bg p-3 text-sm text-error-text">
					{error}
				</div>
			)}

			<div>
				<label htmlFor="org-name" className="mb-1 block text-sm font-medium text-text-primary">
					Organization name
				</label>
				<input
					id="org-name"
					type="text"
					value={name}
					onChange={(e) => handleNameChange(e.target.value)}
					required
					className="w-full rounded-[3px] border border-border px-3 py-2 text-sm text-text-primary shadow-sm focus:border-border-focus focus:ring-1 focus:ring-brand focus:outline-none"
					placeholder="Acme Security"
				/>
			</div>

			<div>
				<label htmlFor="org-slug" className="mb-1 block text-sm font-medium text-text-primary">
					URL slug
				</label>
				<div className="flex items-center rounded-[3px] border border-border bg-white shadow-sm focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
					<span className="pl-3 text-sm text-text-secondary">lantern.app/</span>
					<input
						id="org-slug"
						type="text"
						value={slug}
						onChange={(e) => handleSlugChange(e.target.value)}
						required
						pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
						className="flex-1 rounded-r-[3px] border-0 px-1 py-2 text-sm text-text-primary focus:ring-0 focus:outline-none"
						placeholder="acme-security"
					/>
				</div>
				<p className="mt-1 text-xs text-text-secondary">
					Lowercase letters, numbers, and hyphens only.
				</p>
			</div>

			<button
				type="submit"
				disabled={loading || !name || !slug}
				className="w-full cursor-pointer rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-hover focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				{loading ? "Creating..." : "Create Organization"}
			</button>
		</form>
	);
}
