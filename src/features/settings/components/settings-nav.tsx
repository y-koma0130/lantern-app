"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SettingsNavProps {
	orgSlug: string;
}

const tabs = [
	{ label: "Competitors", segment: "competitors" },
	{ label: "Delivery", segment: "delivery" },
	{ label: "Members", segment: "members" },
] as const;

export function SettingsNav({ orgSlug }: SettingsNavProps) {
	const pathname = usePathname();

	return (
		<nav className="border-b border-[#DFE1E6]">
			<div className="flex gap-0">
				{tabs.map((tab) => {
					const href = `/${orgSlug}/settings/${tab.segment}`;
					const isActive = pathname.startsWith(href);

					return (
						<Link
							key={tab.segment}
							href={href}
							className={`relative px-4 py-3 text-sm font-medium transition-colors ${
								isActive ? "text-[#0052CC]" : "text-[#505F79] hover:text-[#172B4D]"
							}`}
						>
							{tab.label}
							{isActive && (
								<span className="absolute right-0 bottom-0 left-0 h-[2px] bg-[#0052CC]" />
							)}
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
