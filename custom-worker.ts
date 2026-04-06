/// <reference types="@cloudflare/workers-types" />
// Custom worker: combines OpenNext (Next.js) fetch handler with cron-triggered pipeline
// @ts-ignore — .open-next/worker.js is generated at build time by opennextjs-cloudflare
import handler from "./.open-next/worker.js";
import { runDailyAlertCheck, runWeeklyPipeline } from "./workers/pipeline.js";

interface Env {
	BROWSER: Fetcher;
	[key: string]: unknown;
}

export default {
	fetch: handler.fetch,

	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
		switch (controller.cron) {
			case "0 6 * * 1":
				ctx.waitUntil(runWeeklyPipeline(env));
				break;
			case "0 8 * * *":
				ctx.waitUntil(runDailyAlertCheck(env));
				break;
			default:
				console.log(`[Cron] Unknown schedule: ${controller.cron}`);
		}
	},
} satisfies ExportedHandler<Env>;
