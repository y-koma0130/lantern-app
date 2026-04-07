"use client";

import { useEffect, useState } from "react";
import { getInsightConfig } from "../lib/insight-types";

interface InsightCardProps {
	type: string;
	competitorName: string;
	summary: string;
	diffDetail: Record<string, unknown>;
}

function extractContext(detail: Record<string, unknown>): string[] {
	const lines: string[] = [];

	if (Array.isArray(detail.changes)) {
		for (const change of (detail.changes as string[]).slice(0, 4)) {
			lines.push(change);
		}
	}

	if (
		!Array.isArray(detail.changes) &&
		detail.previous !== undefined &&
		detail.current !== undefined
	) {
		lines.push(`Before: ${String(detail.previous).slice(0, 200)}`);
		lines.push(`After: ${String(detail.current).slice(0, 200)}`);
	}

	if (Array.isArray(detail.added) && (detail.added as string[]).length > 0) {
		lines.push(`Added: ${(detail.added as string[]).join(", ")}`);
	}
	if (Array.isArray(detail.removed) && (detail.removed as string[]).length > 0) {
		lines.push(`Removed: ${(detail.removed as string[]).join(", ")}`);
	}

	if (Array.isArray(detail.signals)) {
		for (const signal of (detail.signals as string[]).slice(0, 3)) {
			lines.push(signal);
		}
	}

	if (detail.keyword) {
		lines.push(
			`"${detail.keyword}": ${detail.previousCount ?? 0} → ${detail.currentCount ?? 0} mentions`,
		);
	}

	if (detail.theme) lines.push(`Theme: ${detail.theme}`);

	if (Array.isArray(detail.topKeywords) && !detail.signals) {
		const kws = detail.topKeywords as { word: string; count: number; sentiment: string }[];
		const negatives = kws.filter((k) => k.sentiment === "negative").slice(0, 3);
		if (negatives.length > 0) {
			lines.push(`Negative: ${negatives.map((k) => `${k.word} (${k.count}x)`).join(", ")}`);
		}
	}

	if (detail.storyId) {
		lines.push(`${detail.points} points, ${detail.numComments} comments`);
		if (detail.url) lines.push(String(detail.url));
	}
	if (Array.isArray(detail.stories)) {
		for (const s of (detail.stories as { title: string; points: number }[]).slice(0, 3)) {
			lines.push(`"${s.title}" (${s.points}pt)`);
		}
	}

	if (detail.roundName) {
		let line = String(detail.roundName);
		if (detail.amount) line += ` — ${detail.amount}`;
		lines.push(line);
		if (Array.isArray(detail.leadInvestors) && (detail.leadInvestors as string[]).length > 0) {
			lines.push(`Led by ${(detail.leadInvestors as string[]).join(", ")}`);
		}
	}

	if (detail.field === "employeeRange" && detail.previous && detail.current) {
		lines.length = 0;
		lines.push(`${detail.previous} → ${detail.current}`);
	}

	if (typeof detail.salesImplication === "string" && detail.salesImplication) {
		lines.push(`→ ${detail.salesImplication}`);
	}

	return lines;
}

function InsightModal({
	type,
	competitorName,
	summary,
	contextLines,
	onClose,
}: {
	type: string;
	competitorName: string;
	summary: string;
	contextLines: string[];
	onClose: () => void;
}) {
	const config = getInsightConfig(type);

	useEffect(() => {
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
			onClick={onClose}
			onKeyDown={undefined}
			role="presentation"
		>
			<div
				className="mx-4 w-full max-w-lg rounded-[3px] border border-border bg-white p-6 shadow-lg"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={undefined}
				aria-modal="true"
			>
				<div className="mb-3 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span
							className="inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-xs font-semibold"
							style={{ backgroundColor: config.bg, color: config.text }}
						>
							<svg
								width="12"
								height="12"
								viewBox="0 0 16 16"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d={config.iconPath} />
							</svg>
							{config.label}
						</span>
						<span className="text-sm text-text-secondary">{competitorName}</span>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="cursor-pointer text-text-tertiary hover:text-text-primary"
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
							<title>Close</title>
							<path d="M4.28 3.22a.75.75 0 0 0-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 1 0 1.06 1.06L8 9.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L9.06 8l3.72-3.72a.75.75 0 0 0-1.06-1.06L8 6.94 4.28 3.22Z" />
						</svg>
					</button>
				</div>
				<p className="mb-4 text-sm font-semibold leading-snug text-text-primary">{summary}</p>
				{contextLines.length > 0 && (
					<ul className="space-y-2 border-t border-border pt-4">
						{contextLines.map((line) => (
							<li key={line} className="text-sm leading-relaxed text-text-secondary">
								{line}
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

export function InsightCard({ type, competitorName, summary, diffDetail }: InsightCardProps) {
	const config = getInsightConfig(type);
	const contextLines = extractContext(diffDetail);
	const [open, setOpen] = useState(false);
	const hasDetail = contextLines.length > 0;

	return (
		<>
			<div
				className={`rounded-[3px] border border-border bg-white p-4 ${hasDetail ? "cursor-pointer hover:border-brand-subtle" : ""}`}
				onClick={() => hasDetail && setOpen(true)}
				onKeyDown={undefined}
				role={hasDetail ? "button" : undefined}
				tabIndex={hasDetail ? 0 : undefined}
			>
				<div className="mb-1 flex items-center gap-2">
					<span
						className="inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-xs font-semibold"
						style={{ backgroundColor: config.bg, color: config.text }}
					>
						<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
							<path d={config.iconPath} />
						</svg>
						{config.label}
					</span>
					<span className="text-xs text-text-secondary">{competitorName}</span>
				</div>
				<p className="text-sm leading-snug text-text-primary">{summary}</p>
			</div>
			{open && (
				<InsightModal
					type={type}
					competitorName={competitorName}
					summary={summary}
					contextLines={contextLines}
					onClose={() => setOpen(false)}
				/>
			)}
		</>
	);
}
