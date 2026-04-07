"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface OrgSwitcherProps {
	orgs: { id: string; name: string; slug: string }[];
}

export function OrgSwitcher({ orgs }: OrgSwitcherProps) {
	const params = useParams();
	const currentOrgSlug = params.orgSlug as string | undefined;
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const currentOrg = orgs.find((o) => o.slug === currentOrgSlug);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex cursor-pointer items-center gap-2 rounded-[3px] border border-border bg-white px-3 py-1.5 text-sm text-text-primary hover:bg-surface-hover"
			>
				<span>{currentOrg?.name ?? "Select organization"}</span>
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
				<div className="absolute top-full left-0 z-50 mt-1 w-64 rounded-[3px] border border-border bg-white shadow-lg">
					<div className="py-1">
						{orgs.map((org) => (
							<Link
								key={org.id}
								href={`/${org.slug}/dashboard`}
								onClick={() => setOpen(false)}
								className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-hover"
							>
								{org.slug === currentOrgSlug && (
									<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
										<path
											d="M3 8L6.5 11.5L13 5"
											stroke="#06b6d4"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								)}
								{org.slug !== currentOrgSlug && <span className="inline-block w-4" />}
								<span>{org.name}</span>
							</Link>
						))}
					</div>
					<div className="border-t border-border">
						<Link
							href="/onboarding"
							onClick={() => setOpen(false)}
							className="flex items-center gap-2 px-3 py-2 text-sm text-brand hover:bg-surface-hover"
						>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
								<path d="M8 3V13M3 8H13" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
							</svg>
							<span>Create new organization</span>
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
