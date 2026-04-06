"use client";

import { useState } from "react";

interface ExportButtonsProps {
	orgId: string;
	canExport: boolean;
}

function DisabledButtonWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
	return (
		<span className="group relative inline-block">
			<span className="inline-block cursor-not-allowed rounded-[3px] border border-border bg-surface-subtle px-3 py-1.5 text-xs font-medium text-text-disabled">
				{label}
			</span>
			<span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 rounded-[3px] bg-text-primary px-2 py-1 text-xs text-white group-hover:block">
				{tooltip}
			</span>
		</span>
	);
}

export function ExportButtons({ orgId, canExport }: ExportButtonsProps) {
	const [loading, setLoading] = useState<string | null>(null);

	async function handleExport(type: "insights" | "digests") {
		if (!canExport) return;
		setLoading(type);
		try {
			const res = await fetch(`/api/organizations/${orgId}/export?type=${type}`);

			if (!res.ok) return;

			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download =
				res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
				`lantern-${type}.csv`;
			a.click();
			URL.revokeObjectURL(url);
		} finally {
			setLoading(null);
		}
	}

	const enabledClass =
		"cursor-pointer rounded-[3px] border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover disabled:opacity-50";
	const upgradeTooltip = "Upgrade to Pro or higher to export CSV";

	return (
		<div className="flex gap-2">
			{canExport ? (
				<button
					type="button"
					onClick={() => handleExport("insights")}
					disabled={loading !== null}
					className={enabledClass}
				>
					{loading === "insights" ? "Exporting..." : "Export Insights CSV"}
				</button>
			) : (
				<DisabledButtonWithTooltip label="Export Insights CSV" tooltip={upgradeTooltip} />
			)}

			{canExport ? (
				<button
					type="button"
					onClick={() => handleExport("digests")}
					disabled={loading !== null}
					className={enabledClass}
				>
					{loading === "digests" ? "Exporting..." : "Export Digests CSV"}
				</button>
			) : (
				<DisabledButtonWithTooltip label="Export Digests CSV" tooltip={upgradeTooltip} />
			)}
		</div>
	);
}
