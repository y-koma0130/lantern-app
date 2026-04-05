import { chromium } from "playwright";
import type { Browser } from "playwright";

const NAVIGATION_TIMEOUT_MS = 30_000;
const MAX_CONCURRENT_PAGES = 5;

let launchPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
	if (!launchPromise) {
		launchPromise = chromium.launch({ headless: true });
	}

	const browser = await launchPromise;

	if (!browser.isConnected()) {
		launchPromise = chromium.launch({ headless: true });
		return launchPromise;
	}

	return browser;
}

export async function closeBrowser(): Promise<void> {
	if (!launchPromise) return;
	const browser = await launchPromise;
	launchPromise = null;
	if (browser.isConnected()) {
		await browser.close();
	}
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

	try {
		const browser = await getBrowser();
		const page = await browser.newPage({
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
		releasePageSlot();
	}
}
