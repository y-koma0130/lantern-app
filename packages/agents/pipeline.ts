import { runAnalyst } from "./analyst/index.js";
import { runBattleCardGenerator } from "./battle-card/index.js";
import { runCollector } from "./collector/index.js";
import { runDelivery } from "./delivery/index.js";
import { closeBrowser } from "./shared/browser.js";

export async function runPipeline(): Promise<void> {
	console.log("[Pipeline] Starting full pipeline run...");
	const start = Date.now();

	try {
		await runCollector();
		await runAnalyst();
		await runBattleCardGenerator();
		await runDelivery();

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
