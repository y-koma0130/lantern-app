import { config } from "dotenv";
config({ path: ".env.local" });

const args = process.argv.slice(2).filter((a) => a !== "--");
const stage = args.find((a) => !a.startsWith("--"));
const orgSlugArg = args.find((a) => a.startsWith("--org="))?.split("=")[1];

async function main() {
	const { fetchActiveOrganizations } = await import("./shared/org-repository.js");
	const allOrgs = await fetchActiveOrganizations();

	if (allOrgs.length === 0) {
		console.log("No organizations found.");
		return;
	}

	const orgs = orgSlugArg ? allOrgs.filter((o) => o.slug === orgSlugArg) : allOrgs;

	if (orgs.length === 0) {
		console.error(`Organization not found: ${orgSlugArg}`);
		console.log("Available:", allOrgs.map((o) => o.slug).join(", "));
		process.exit(1);
	}

	if (!stage) {
		console.log(`Running full pipeline for ${orgs.length} org(s)...\n`);
		const { runPipeline } = await import("./pipeline.js");
		await runPipeline(orgs);
		return;
	}

	for (const org of orgs) {
		console.log(`\n=== ${org.name} (${org.slug}) ===\n`);

		switch (stage) {
			case "collector": {
				const { runCollector } = await import("./collector/index.js");
				await runCollector(org);
				break;
			}
			case "analyst": {
				const { runAnalyst } = await import("./analyst/index.js");
				await runAnalyst(org);
				break;
			}
			case "battlecard": {
				const { runBattleCardGenerator } = await import("./battle-card/index.js");
				await runBattleCardGenerator(org);
				break;
			}
			case "delivery": {
				const { runDelivery } = await import("./delivery/index.js");
				await runDelivery(org);
				break;
			}
			default:
				console.error(`Unknown stage: ${stage}`);
				console.log("Usage: tsx agents/run.ts [stage] [--org=slug]");
				console.log("Stages: collector, analyst, battlecard, delivery");
				process.exit(1);
		}
	}
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("Pipeline failed:", err);
		process.exit(1);
	});
