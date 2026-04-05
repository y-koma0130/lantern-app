import { runAnalyst } from "./analyst/index.js";
import { runBattleCardGenerator } from "./battle-card/index.js";
import { runCollector } from "./collector/index.js";
import { runDelivery } from "./delivery/index.js";
import { closeBrowser } from "./shared/browser.js";
import { fetchActiveOrganizations } from "./shared/org-repository.js";

export async function runPipeline(): Promise<void> {
	console.log("[Pipeline] Starting full pipeline run...");
	const start = Date.now();

	try {
		const orgs = await fetchActiveOrganizations();
		console.log(`[Pipeline] Found ${orgs.length} active organizations.`);

		for (const org of orgs) {
			console.log(`[Pipeline] Processing org: ${org.name} (${org.id})`);
			await runCollector(org);
			await runAnalyst(org);
			await runBattleCardGenerator(org);
			await runDelivery(org);
		}

		const elapsed = ((Date.now() - start) / 1000).toFixed(1);
		console.log(`[Pipeline] Complete in ${elapsed}s`);
	} catch (err) {
		const elapsed = ((Date.now() - start) / 1000).toFixed(1);
		console.error(`[Pipeline] Failed after ${elapsed}s:`, err);
		throw err;
	} finally {
		await closeBrowser();
	}
}
