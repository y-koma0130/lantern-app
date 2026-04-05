import { launch } from "@cloudflare/playwright";
import type { Browser, Page } from "@cloudflare/playwright";

const NAVIGATION_TIMEOUT_MS = 30_000;
const MAX_CONCURRENT_PAGES = 5;

// The browser binding is passed from the Worker environment
let browserBinding: unknown = null;

export function setBrowserBinding(binding: unknown): void {
	browserBinding = binding;
}

let activePages = 0;
const waitQueue: (() => void)[] = [];

async function acquirePageSlot(): Promise<void> {
	if (activePages < MAX_CONCURRENT_PAGES) {
		activePages++;
		return;
	}
	return new Promise<void>((resolve) => {
		waitQueue.push(() => {
			activePages++;
			resolve();
		});
	});
}

function releasePageSlot(): void {
	activePages--;
	const next = waitQueue.shift();
	if (next) next();
}

export async function fetchRenderedHtml(
	url: string,
	options?: { waitForSelector?: string },
): Promise<string | null> {
	await acquirePageSlot();

	let browser: Browser | null = null;

	try {
		browser = await launch(browserBinding as Fetcher);
		const page: Page = await browser.newPage({
			userAgent:
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
		});

		try {
			await page.goto(url, {
				waitUntil: "networkidle",
				timeout: NAVIGATION_TIMEOUT_MS,
			});

			if (options?.waitForSelector) {
				await page.waitForSelector(options.waitForSelector, { timeout: 5_000 }).catch(() => {
					// Selector not found — proceed with current DOM
				});
			}

			return await page.content();
		} finally {
			await page.close();
		}
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.warn(`[Browser] Failed to load ${url}: ${message}`);
		return null;
	} finally {
		if (browser) {
			await browser.close();
		}
		releasePageSlot();
	}
}

export async function closeBrowser(): Promise<void> {
	// No-op for Cloudflare — browser sessions are managed by the platform
}
