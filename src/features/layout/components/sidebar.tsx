"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
	orgs: { id: string; name: string; slug: string }[];
}

interface NavItem {
	label: string;
	href: string;
	icon: string;
	children?: { label: string; href: string }[];
}

function getNavItems(orgSlug: string): NavItem[] {
	return [
		{
			label: "Dashboard",
			href: `/${orgSlug}/dashboard`,
			icon: "grid",
		},
		{
			label: "Settings",
			href: `/${orgSlug}/settings`,
			icon: "settings",
			children: [
				{ label: "Competitors", href: `/${orgSlug}/settings/competitors` },
				{ label: "Delivery", href: `/${orgSlug}/settings/delivery` },
				{ label: "Members", href: `/${orgSlug}/settings/members` },
			],
		},
		{
			label: "Billing",
			href: `/${orgSlug}/billing`,
			icon: "billing",
		},
	];
}

function NavIcon({ type }: { type: string }) {
	switch (type) {
		case "grid":
			return (
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
					<rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
					<rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
					<rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
				</svg>
			);
		case "settings":
			return (
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
					<path
						d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.05 3.05L4.11 4.11M11.89 11.89L12.95 12.95M3.05 12.95L4.11 11.89M11.89 4.11L12.95 3.05"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
					/>
				</svg>
			);
		case "billing":
			return (
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<rect
						x="1.5"
						y="3"
						width="13"
						height="10"
						rx="1.5"
						stroke="currentColor"
						strokeWidth="1.5"
					/>
					<path d="M1.5 6.5H14.5" stroke="currentColor" strokeWidth="1.5" />
				</svg>
			);
		default:
			return null;
	}
}

export function Sidebar({ orgs: _orgs }: SidebarProps) {
	const pathname = usePathname();
	const params = useParams();
	const currentOrgSlug = (params.orgSlug as string) ?? "";
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(pathname.includes("/settings") ? ["Settings"] : []),
	);
	const [mobileOpen, setMobileOpen] = useState(false);

	const navItems = getNavItems(currentOrgSlug);

	function toggleSection(label: string) {
		setExpandedSections((prev) => {
			const next = new Set(prev);
			if (next.has(label)) {
				next.delete(label);
			} else {
				next.add(label);
			}
			return next;
		});
	}

	function isActive(href: string) {
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	const nav = (
		<nav className="flex flex-col gap-0.5 px-3 py-4">
			{navItems.map((item) => (
				<div key={item.label}>
					{item.children ? (
						<>
							<button
								type="button"
								onClick={() => toggleSection(item.label)}
								className={`flex w-full cursor-pointer items-center gap-3 rounded-[3px] px-3 py-2 text-left text-sm font-medium transition-colors ${
									isActive(item.href)
										? "bg-[#E3FCEF] text-[#0052CC]"
										: "text-[#172B4D] hover:bg-[#EBECF0]"
								}`}
							>
								<NavIcon type={item.icon} />
								<span className="flex-1">{item.label}</span>
								<svg
									width="16"
									height="16"
									viewBox="0 0 16 16"
									fill="none"
									aria-hidden="true"
									className={`transition-transform ${expandedSections.has(item.label) ? "rotate-180" : ""}`}
								>
									<path
										d="M4 6L8 10L12 6"
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</button>
							{expandedSections.has(item.label) && (
								<div className="ml-8 mt-0.5 flex flex-col gap-0.5">
									{item.children.map((child) => (
										<Link
											key={child.href}
											href={child.href}
											onClick={() => setMobileOpen(false)}
											className={`rounded-[3px] px-3 py-1.5 text-sm transition-colors ${
												isActive(child.href)
													? "bg-[#E3FCEF] text-[#0052CC] font-medium"
													: "text-[#505F79] hover:bg-[#EBECF0] hover:text-[#172B4D]"
											}`}
										>
											{child.label}
										</Link>
									))}
								</div>
							)}
						</>
					) : (
						<Link
							href={item.href}
							onClick={() => setMobileOpen(false)}
							className={`flex items-center gap-3 rounded-[3px] px-3 py-2 text-sm font-medium transition-colors ${
								isActive(item.href)
									? "bg-[#E3FCEF] text-[#0052CC]"
									: "text-[#172B4D] hover:bg-[#EBECF0]"
							}`}
						>
							<NavIcon type={item.icon} />
							<span>{item.label}</span>
						</Link>
					)}
				</div>
			))}
		</nav>
	);

	return (
		<>
			{/* Mobile toggle button */}
			<button
				type="button"
				onClick={() => setMobileOpen(!mobileOpen)}
				className="fixed top-16 left-3 z-40 cursor-pointer rounded-[3px] border border-[#DFE1E6] bg-white p-2 shadow-sm md:hidden"
				aria-label="Toggle sidebar"
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<path
						d="M2 4H14M2 8H14M2 12H14"
						stroke="#172B4D"
						strokeWidth="1.5"
						strokeLinecap="round"
					/>
				</svg>
			</button>

			{/* Mobile overlay */}
			{mobileOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/30 md:hidden"
					role="presentation"
					onClick={() => setMobileOpen(false)}
					onKeyDown={(e) => {
						if (e.key === "Escape") setMobileOpen(false);
					}}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`fixed top-14 left-0 z-30 h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-[#DFE1E6] bg-white transition-transform md:static md:translate-x-0 ${
					mobileOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				{nav}
			</aside>
		</>
	);
}
