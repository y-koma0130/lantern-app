import { runAnalyst } from "./analyst/index.js";
import { runBattleCardGenerator } from "./battle-card/index.js";
import { runCollector } from "./collector/index.js";
import { runDelivery } from "./delivery/index.js";

export async function runPipeline(): Promise<void> {
	console.log("[Pipeline] Starting full pipeline run...");
	const start = Date.now();

	await runCollector();
	await runAnalyst();
	await runBattleCardGenerator();
	await runDelivery();

	const elapsed = ((Date.now() - start) / 1000).toFixed(1);
	console.log(`[Pipeline] Complete in ${elapsed}s`);
}
