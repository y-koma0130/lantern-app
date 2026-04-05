interface PipelineEnv {
	BROWSER: Fetcher;
	SUPABASE_URL: string;
	SUPABASE_SERVICE_ROLE_KEY: string;
	ANTHROPIC_API_KEY: string;
	RESEND_API_KEY: string;
}

export default {
	async scheduled(event: ScheduledEvent, _env: PipelineEnv, _ctx: ExecutionContext) {
		if (event.cron === "0 6 * * 1") {
			console.log("[Cron] Weekly pipeline triggered");
			// TODO: invoke pipeline workflow with env bindings
		}

		if (event.cron === "0 8 * * *") {
			console.log("[Cron] Daily alert check triggered");
			// TODO: daily alert for Pro/Team orgs
		}
	},
};
