"use client";

import { useState } from "react";

interface ExportButtonsProps {
	orgId: string;
}

export function ExportButtons({ orgId }: ExportButtonsProps) {
	const [loading, setLoading] = useState<string | null>(null);

	async function handleExport(type: "insights" | "digests") {
		setLoading(type);
		try {
			const res = await fetch(`/api/organizations/${orgId}/export?type=${type}`);

			if (res.status === 403) {
				const data = (await res.json()) as { error?: string };
				alert(data.error ?? "Upgrade required");
				return;
			}

			if (!res.ok) {
				alert("Export failed");
				return;
			}

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

	return (
		<div className="flex gap-2">
			<button
				type="button"
				onClick={() => handleExport("insights")}
				disabled={loading !== null}
				className="cursor-pointer rounded-[3px] border border-[#DFE1E6] bg-white px-3 py-1.5 text-xs font-medium text-[#505F79] hover:bg-[#F4F5F7] disabled:opacity-50"
			>
				{loading === "insights" ? "Exporting..." : "Export Insights CSV"}
			</button>
			<button
				type="button"
				onClick={() => handleExport("digests")}
				disabled={loading !== null}
				className="cursor-pointer rounded-[3px] border border-[#DFE1E6] bg-white px-3 py-1.5 text-xs font-medium text-[#505F79] hover:bg-[#F4F5F7] disabled:opacity-50"
			>
				{loading === "digests" ? "Exporting..." : "Export Digests CSV"}
			</button>
		</div>
	);
}
