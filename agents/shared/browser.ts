const NAVIGATION_TIMEOUT_MS = 30_000;
const POST_NAVIGATION_WAIT_MS = 2_000;
const MAX_CONCURRENT_PAGES = 5;

const isCloudflare =
	typeof globalThis.caches !== "undefined" && typeof globalThis.navigator === "undefined";

// Cloudflare Browser Rendering binding
let browserBinding: unknown = null;

export function setBrowserBinding(binding: unknown): void {
	browserBinding = binding;
}

// Local Playwright browser singleton
let localBrowser: { close(): Promise<void>; newPage(opts?: unknown): Promise<unknown> } | null =
	null;

async function getLocalBrowser() {
	if (!localBrowser) {
		const { chromium } = await import("playwright");
		localBrowser = await chromium.launch({ headless: true });
	}
	return localBrowser;
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
		if (isCloudflare && browserBinding) {
			return await fetchWithCloudflare(url, options);
		}
		return await fetchWithLocal(url, options);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.warn(`[Browser] Failed to load ${url}: ${message}`);
		return null;
	} finally {
		releasePageSlot();
	}
}

async function fetchWithCloudflare(
	url: string,
	options?: { waitForSelector?: string },
): Promise<string | null> {
	const { launch } = await import("@cloudflare/playwright");
	const browser = await launch(browserBinding as Fetcher);
	const page = await browser.newPage({
		userAgent:
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
	});

	try {
		await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS });
		await new Promise((r) => setTimeout(r, POST_NAVIGATION_WAIT_MS));

		if (options?.waitForSelector) {
			await page.waitForSelector(options.waitForSelector, { timeout: 5_000 }).catch(() => {});
		}

		return await page.content();
	} finally {
		await page.close();
		await browser.close();
	}
}

async function fetchWithLocal(
	url: string,
	options?: { waitForSelector?: string },
): Promise<string | null> {
	const browser = await getLocalBrowser();
	const page = (await browser.newPage({
		userAgent:
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
	})) as {
		goto(url: string, opts: unknown): Promise<void>;
		waitForSelector(sel: string, opts: unknown): Promise<void>;
		content(): Promise<string>;
		close(): Promise<void>;
	};

	try {
		await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS });
		await new Promise((r) => setTimeout(r, POST_NAVIGATION_WAIT_MS));

		if (options?.waitForSelector) {
			await page.waitForSelector(options.waitForSelector, { timeout: 5_000 }).catch(() => {});
		}

		return await page.content();
	} finally {
		await page.close();
	}
}

export async function closeBrowser(): Promise<void> {
	if (localBrowser) {
		await localBrowser.close();
		localBrowser = null;
	}
}
