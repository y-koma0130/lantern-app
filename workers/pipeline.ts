import { runPipeline } from "../agents/pipeline.js";
import { setBrowserBinding } from "../agents/shared/browser.js";

interface PipelineEnv {
	BROWSER: Fetcher;
}

export async function runWeeklyPipeline(env: PipelineEnv): Promise<void> {
	setBrowserBinding(env.BROWSER);
	await runPipeline();
}

export async function runDailyAlertCheck(_env: PipelineEnv): Promise<void> {
	// TODO: Pro/Team orgs only — check for high-importance insights (score >= 8)
	// and send alert emails for insights detected since yesterday
	console.log("[Cron] Daily alert check — not yet implemented");
}
