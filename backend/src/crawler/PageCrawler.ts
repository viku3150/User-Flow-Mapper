import * as cheerio from "cheerio";
import { PlaywrightCrawler } from "crawlee";
import { Link, LinkPosition, PageMetadata } from "./types";
import { UrlUtils } from "../utils/UrlUtils";
import { CrawlConfig, CrawlConstraintsImpl } from "../config/CrawlConfig";

/**
 * Handles crawling of individual pages and extraction of links
 */
export class PageCrawler {
	private visitedUrls: Set<string> = new Set();
	private pages: Map<string, PageMetadata> = new Map();
	private crawlStartTime: number = 0;

	/**
	 * Detect the position/context of a link within the page structure
	 */
	private detectLinkPosition(
		element: cheerio.Element,
		$: cheerio.Root,
	): LinkPosition {
		const $element = $(element);
		const parents = $element.parents();

		if (
			parents.is("header, nav") ||
			$element.closest("header, nav").length > 0
		) {
			return LinkPosition.HEADER;
		}

		if (parents.is("footer") || $element.closest("footer").length > 0) {
			return LinkPosition.FOOTER;
		}

		if (
			parents.is('aside, [class*="sidebar"]') ||
			$element.closest('aside, [class*="sidebar"]').length > 0
		) {
			return LinkPosition.SIDEBAR;
		}

		const classList = $element.attr("class") || "";
		const idList = $element.attr("id") || "";
		const navKeywords = ["nav", "menu", "header"];

		if (
			navKeywords.some(
				(keyword) =>
					classList.toLowerCase().includes(keyword) ||
					idList.toLowerCase().includes(keyword),
			)
		) {
			return LinkPosition.NAVIGATION;
		}

		return LinkPosition.CONTENT;
	}

	/**
	 * Extract all links from a page with context
	 */
	private extractLinks(
		html: string,
		baseUrl: string,
		config: CrawlConfig,
	): Link[] {
		const $ = cheerio.load(html);
		const links: Link[] = [];
		const baseDomain = UrlUtils.getDomain(baseUrl);
		const constraints = new CrawlConstraintsImpl(config);
		const maxLinks = config.constraints?.maxLinksPerPage ?? 50;

		$("a[href]").each((_, element) => {
			if (links.length >= maxLinks) return false; // Stop when limit reached

			const href = $(element).attr("href");
			if (!href) return;

			try {
				const absoluteUrl = new URL(href, baseUrl).href;

				// Apply constraints
				if (!constraints.shouldFollowLink(absoluteUrl, baseUrl)) {
					return;
				}

				const normalizedUrl = UrlUtils.normalize(absoluteUrl);
				const linkText = $(element).text().trim();
				const position = this.detectLinkPosition(element, $);

				const parent = $(element).parent();
				const context = parent.text().trim().substring(0, 100);

				links.push({
					href: normalizedUrl,
					text: linkText,
					position,
					context,
				});
			} catch (error) {
				// Skip invalid URLs
			}
		});

		return links;
	}

	/**
	 * Create crawler instance with configuration
	 */
	async crawl(config: CrawlConfig): Promise<Map<string, PageMetadata>> {
		const { startUrl, maxDepth, maxPages, credentials, constraints } = config;
		const baseDomain = UrlUtils.getDomain(startUrl);
		const normalizedStartUrl = UrlUtils.normalize(startUrl);
		this.crawlStartTime = Date.now();

		const visitedUrls = this.visitedUrls;
		const pages = this.pages;
		const extractLinks = this.extractLinks.bind(this);
		const crawlStartTime = this.crawlStartTime;
		const constraintsImpl = new CrawlConstraintsImpl(config);

		let processedCount = 0;
		let lastRequestTime = 0;

		const crawler = new PlaywrightCrawler({
			maxRequestsPerCrawl: maxPages,
			maxConcurrency: constraints?.maxConcurrency ?? 3,
			requestHandlerTimeoutSecs:
				(constraints?.requestTimeoutMs ?? 30000) / 1000,
			navigationTimeoutSecs: (constraints?.navigationTimeoutMs ?? 30000) / 1000,

			launchContext: {
				launchOptions: {
					headless: constraints?.headless ?? true,
				},
			},

			preNavigationHooks: credentials
				? [
						async ({ page, request, log }) => {
							// Handle login if credentials provided
							if (credentials.loginUrl && request.url === startUrl) {
								try {
									log.info("Attempting login...");
									await page.goto(credentials.loginUrl);

									const usernameSelector =
										credentials.usernameSelector ||
										'input[name="username"], input[type="email"]';
									const passwordSelector =
										credentials.passwordSelector ||
										'input[name="password"], input[type="password"]';
									const submitSelector =
										credentials.submitSelector || 'button[type="submit"]';

									await page.fill(usernameSelector, credentials.username);
									await page.fill(passwordSelector, credentials.password);
									await page.click(submitSelector);
									await page.waitForLoadState("networkidle");

									log.info("Login successful");
								} catch (error: any) {
									log.error("Login failed:", error.message);
								}
							}
						},
					]
				: [],

			async requestHandler({ request, page, enqueueLinks, log }) {
				// Check time limit
				if (constraintsImpl.hasExceededTimeLimit(crawlStartTime)) {
					log.warning("⏱️  Max crawl duration exceeded, stopping...");
					return;
				}

				// Rate limiting
				const delay = constraintsImpl.getRequestDelay();
				if (delay > 0) {
					const timeSinceLastRequest = Date.now() - lastRequestTime;
					if (timeSinceLastRequest < delay) {
						await new Promise((resolve) =>
							setTimeout(resolve, delay - timeSinceLastRequest),
						);
					}
				}
				lastRequestTime = Date.now();

				const url = request.url;
				const normalizedUrl = UrlUtils.normalize(url);
				const depth = (request.userData.depth as number) ?? 0;

				// Check constraints
				if (!constraintsImpl.shouldCrawlUrl(url)) {
					log.info(`Skipping ${url} due to constraints`);
					return;
				}

				if (visitedUrls.has(normalizedUrl)) {
					return;
				}

				if (depth > maxDepth) {
					return;
				}

				visitedUrls.add(normalizedUrl);
				processedCount++;

				if (processedCount % 5 === 0) {
					console.log(`   📄 Processed ${processedCount}/${maxPages} pages...`);
				}

				try {
					// Set custom user agent if provided
					if (constraints?.userAgent) {
						await page.setExtraHTTPHeaders({
							"User-Agent": constraints.userAgent,
						});
					}

					// Set viewport if provided
					if (constraints?.viewport) {
						await page.setViewportSize(constraints.viewport);
					}

					const title = await Promise.race([
						page.title(),
						new Promise<string>((_, reject) =>
							setTimeout(() => reject(new Error("Title timeout")), 5000),
						),
					]).catch(() => "Untitled");

					const html = await Promise.race([
						page.content(),
						new Promise<string>((_, reject) =>
							setTimeout(() => reject(new Error("Content timeout")), 10000),
						),
					]).catch(() => "");

					const links = html ? extractLinks(html, url, config) : [];

					const metadata: PageMetadata = {
						url: normalizedUrl,
						title,
						depth,
						outgoingLinks: links,
						timestamp: Date.now(),
					};
					pages.set(normalizedUrl, metadata);

					// Filter links based on constraints
					const internalLinks = links
						.filter((link: Link) =>
							constraintsImpl.shouldFollowLink(link.href, url),
						)
						.map((link: Link) => link.href);

					if (depth < maxDepth && internalLinks.length > 0) {
						await enqueueLinks({
							urls: internalLinks,
							userData: { depth: depth + 1 },
						});
					}
				} catch (error: any) {
					log.error(`Error processing ${url}: ${error.message}`);
				}
			},

			failedRequestHandler({ request, log }) {
				log.error(`Failed to crawl: ${request.url}`);
			},
		});

		try {
			await crawler.run([
				{
					url: startUrl,
					userData: { depth: 0 },
				},
			]);
		} catch (error: any) {
			console.error("Crawler error:", error.message);
		}

		console.log(`   ✅ Crawl completed: ${this.pages.size} pages collected`);
		return this.pages;
	}
}
