import { isErrorResponse, requireUser, zodErrorResponse } from "@/lib/api";
import { UPGRADE_MESSAGES, canUseCsvExport } from "@/lib/plan-limits";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const exportSchema = z.object({
	type: z.enum(["insights", "digests"]),
});

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ orgId: string }> },
) {
	try {
		const { orgId } = await params;
		const auth = await requireUser();
		if (isErrorResponse(auth)) return auth;
		const { supabase } = auth;

		const { searchParams } = request.nextUrl;
		const parsed = exportSchema.safeParse({ type: searchParams.get("type") });
		if (!parsed.success) return zodErrorResponse(parsed);

		const { type } = parsed.data;

		// Check plan
		const { data: org } = await supabase
			.from("organizations")
			.select("plan")
			.eq("id", orgId)
			.single();

		if (!org) {
			return NextResponse.json({ error: "Organization not found" }, { status: 404 });
		}

		if (!canUseCsvExport(org.plan)) {
			return NextResponse.json({ error: UPGRADE_MESSAGES.csvExport }, { status: 403 });
		}

		let csv: string;
		let filename: string;

		if (type === "insights") {
			const { data: insights } = await supabase
				.from("insights")
				.select("id, type, importance_score, summary, week_of, created_at, competitors(name)")
				.eq("org_id", orgId)
				.order("created_at", { ascending: false })
				.limit(1000);

			const rows = (insights ?? []).map((i) => {
				const competitor = i.competitors as unknown as { name: string } | null;
				return {
					id: i.id,
					type: i.type,
					importance_score: i.importance_score,
					summary: i.summary,
					competitor: competitor?.name ?? "",
					week_of: i.week_of,
					created_at: i.created_at,
				};
			});

			csv = toCsv(
				["ID", "Type", "Score", "Summary", "Competitor", "Week", "Created"],
				rows.map((r) => [
					r.id,
					r.type,
					String(r.importance_score),
					r.summary,
					r.competitor,
					r.week_of,
					r.created_at,
				]),
			);
			filename = `lantern-insights-${new Date().toISOString().split("T")[0]}.csv`;
		} else {
			const { data: digests } = await supabase
				.from("digests")
				.select("id, week_of, content_md, generated_at")
				.eq("org_id", orgId)
				.order("generated_at", { ascending: false })
				.limit(100);

			csv = toCsv(
				["ID", "Week", "Content", "Generated"],
				(digests ?? []).map((d) => [d.id, d.week_of, d.content_md, d.generated_at]),
			);
			filename = `lantern-digests-${new Date().toISOString().split("T")[0]}.csv`;
		}

		return new NextResponse(csv, {
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

function toCsv(headers: string[], rows: string[][]): string {
	const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
	const lines = [headers.map(escapeCsv).join(",")];
	for (const row of rows) {
		lines.push(row.map(escapeCsv).join(","));
	}
	return lines.join("\n");
}
