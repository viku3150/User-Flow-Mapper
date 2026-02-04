import { PageMetadata, Link, LinkPosition } from "../crawler/types";

/**
 * Advanced noise reduction with global navigation detection
 *
 * Key strategies:
 * 1. Global Navigation Detection: Links appearing on most pages (>85% threshold)
 * 2. Structural Noise: Links in footers
 * 3. Low-Value Links: Social media, logout, external services
 * 4. Frequency Analysis: Links with identical text appearing too frequently
 * 5. Hub Page Detection: Pages that are linked from everywhere
 */
export class NoiseReducer {
	private readonly GLOBAL_NAV_THRESHOLD = 0.85; // 85% of pages
	private readonly HIGH_FREQUENCY_THRESHOLD = 0.75; // 75% of pages
	private readonly HUB_PAGE_THRESHOLD = 0.9; // Linked from 90% of pages

	/**
	 * Identify global navigation links that appear across most pages
	 * These are typically: Home, About, Contact, Login, etc.
	 */
	identifyGlobalNavigation(
		pages: Map<string, PageMetadata>,
	): Map<string, NavigationInfo> {
		const linkFrequency = new Map<string, Set<string>>(); // link -> set of pages it appears on
		const linkTextMap = new Map<string, string>(); // link -> most common text
		const linkPositionMap = new Map<string, LinkPosition[]>(); // link -> positions
		const totalPages = pages.size;

		// Count frequency of each link and track context
		for (const [pageUrl, page] of pages.entries()) {
			const seenLinks = new Set<string>();

			page.outgoingLinks.forEach((link) => {
				if (!seenLinks.has(link.href)) {
					seenLinks.add(link.href);

					if (!linkFrequency.has(link.href)) {
						linkFrequency.set(link.href, new Set());
						linkPositionMap.set(link.href, []);
					}

					linkFrequency.get(link.href)!.add(pageUrl);
					linkPositionMap.get(link.href)!.push(link.position);

					// Track most common link text
					if (!linkTextMap.has(link.href) && link.text) {
						linkTextMap.set(link.href, link.text);
					}
				}
			});
		}

		// Identify global navigation links with detailed info
		const globalNavLinks = new Map<string, NavigationInfo>();

		linkFrequency.forEach((appearingOnPages, link) => {
			const frequency = appearingOnPages.size / totalPages;

			// Only consider as global nav if appears on vast majority of pages
			if (frequency >= this.GLOBAL_NAV_THRESHOLD) {
				const positions = linkPositionMap.get(link) || [];
				const isStructural = this.isStructuralNavigation(positions);

				globalNavLinks.set(link, {
					url: link,
					frequency,
					appearingOnPages: appearingOnPages.size,
					totalPages,
					linkText: linkTextMap.get(link) || "",
					positions,
					isStructural,
					isGlobalNav: true,
				});
			}
		});

		console.log(`\n🔍 Global Navigation Analysis:`);
		console.log(`   Total unique links: ${linkFrequency.size}`);
		console.log(
			`   Global nav threshold: ${(this.GLOBAL_NAV_THRESHOLD * 100).toFixed(0)}% of pages`,
		);
		console.log(`   Global nav links identified: ${globalNavLinks.size}`);

		// Show top global nav links
		if (globalNavLinks.size > 0) {
			const sorted = Array.from(globalNavLinks.values())
				.sort((a, b) => b.frequency - a.frequency)
				.slice(0, 10);

			console.log(`\n   Top Global Navigation Links:`);
			sorted.forEach((info, idx) => {
				console.log(
					`   ${idx + 1}. ${info.linkText || "Untitled"} (${(info.frequency * 100).toFixed(1)}% of pages)`,
				);
			});
		}

		return globalNavLinks;
	}

	/**
	 * Check if link positions indicate structural navigation
	 */
	private isStructuralNavigation(positions: LinkPosition[]): boolean {
		const structuralPositions = [
			LinkPosition.HEADER,
			LinkPosition.NAVIGATION,
			LinkPosition.FOOTER,
			LinkPosition.SIDEBAR,
		];

		const structuralCount = positions.filter((pos) =>
			structuralPositions.includes(pos),
		).length;

		// >70% in structural positions
		return structuralCount / positions.length > 0.7;
	}

	/**
	 * Identify hub pages that are heavily linked (usually homepage, main categories)
	 */
	identifyHubPages(pages: Map<string, PageMetadata>): Set<string> {
		const incomingLinks = new Map<string, Set<string>>(); // target -> set of sources
		const totalPages = pages.size;

		// Count incoming links for each page
		pages.forEach((page, sourceUrl) => {
			page.outgoingLinks.forEach((link) => {
				if (!incomingLinks.has(link.href)) {
					incomingLinks.set(link.href, new Set());
				}
				incomingLinks.get(link.href)!.add(sourceUrl);
			});
		});

		// Identify hub pages
		const hubPages = new Set<string>();
		incomingLinks.forEach((sources, targetUrl) => {
			const linkFrequency = sources.size / totalPages;
			if (linkFrequency >= this.HUB_PAGE_THRESHOLD) {
				hubPages.add(targetUrl);
			}
		});

		console.log(`\n🎯 Hub Pages Identified: ${hubPages.size}`);
		if (hubPages.size > 0) {
			console.log(
				`   These pages are linked from >${(this.HUB_PAGE_THRESHOLD * 100).toFixed(0)}% of all pages`,
			);
		}

		return hubPages;
	}

	/**
	 * Identify structural noise links (footer only, keep header for now)
	 */
	identifyStructuralNoise(pages: Map<string, PageMetadata>): Set<string> {
		const structuralLinks = new Set<string>();
		const noisePositions = [LinkPosition.FOOTER]; // Only footer

		for (const page of pages.values()) {
			page.outgoingLinks
				.filter((link) => noisePositions.includes(link.position))
				.forEach((link) => structuralLinks.add(link.href));
		}

		return structuralLinks;
	}

	/**
	 * Identify low-value links that don't contribute to user flows
	 */
	identifyLowValueLinks(pages: Map<string, PageMetadata>): Set<string> {
		const lowValueLinks = new Set<string>();
		const lowValuePatterns = [
			/logout/i,
			/sign-?out/i,
			/log-?out/i,
			/twitter\.com/,
			/facebook\.com/,
			/linkedin\.com/,
			/instagram\.com/,
			/youtube\.com/,
			/t\.co\//,
			/#$/,
			/javascript:/,
			/mailto:/,
			/tel:/,
			/\.rss$/,
			/\.xml$/,
			/\/feed/,
		];

		for (const page of pages.values()) {
			page.outgoingLinks
				.filter((link) =>
					lowValuePatterns.some((pattern) => pattern.test(link.href)),
				)
				.forEach((link) => lowValueLinks.add(link.href));
		}

		return lowValueLinks;
	}

	/**
	 * Identify links with repetitive text patterns (likely navigation)
	 */
	identifyRepetitiveLinks(pages: Map<string, PageMetadata>): Set<string> {
		const linkTextFrequency = new Map<string, Set<string>>();
		const totalPages = pages.size;

		// Track which pages have each link text
		for (const page of pages.values()) {
			page.outgoingLinks.forEach((link) => {
				const normalizedText = link.text.toLowerCase().trim();
				if (!normalizedText || normalizedText.length < 3) return; // Skip very short text

				if (!linkTextFrequency.has(normalizedText)) {
					linkTextFrequency.set(normalizedText, new Set());
				}
				linkTextFrequency.get(normalizedText)!.add(link.href);
			});
		}

		// Find links that appear too frequently with the same text
		const repetitiveLinks = new Set<string>();
		linkTextFrequency.forEach((urls, text) => {
			const frequency = urls.size / totalPages;
			if (frequency >= this.HIGH_FREQUENCY_THRESHOLD) {
				urls.forEach((url) => repetitiveLinks.add(url));
			}
		});

		return repetitiveLinks;
	}

	/**
	 * Main noise reduction function - combines all heuristics with safety checks
	 */
	reduceNoise(pages: Map<string, PageMetadata>): NoiseReductionResult {
		console.log("\n🧹 Starting Noise Reduction...");

		// Gather all noise categories
		const globalNav = this.identifyGlobalNavigation(pages);
		const hubPages = this.identifyHubPages(pages);
		const structuralNoise = this.identifyStructuralNoise(pages);
		const lowValueLinks = this.identifyLowValueLinks(pages);
		const repetitiveLinks = this.identifyRepetitiveLinks(pages);

		// More conservative: only combine certain noise types
		const allNoiseLinks = new Set([
			...globalNav.keys(),
			...structuralNoise,
			...lowValueLinks,
			// Don't include repetitiveLinks unless also global nav
		]);

		// For debugging/analysis, categorize noise
		const noiseCategories = new Map<string, string[]>();
		globalNav.forEach((info, link) => {
			if (!noiseCategories.has(link)) noiseCategories.set(link, []);
			noiseCategories.get(link)!.push("global_navigation");
		});
		structuralNoise.forEach((link) => {
			if (!noiseCategories.has(link)) noiseCategories.set(link, []);
			noiseCategories.get(link)!.push("structural");
		});
		lowValueLinks.forEach((link) => {
			if (!noiseCategories.has(link)) noiseCategories.set(link, []);
			noiseCategories.get(link)!.push("low_value");
		});

		// Create cleaned pages with noise removed
		const cleanedPages = new Map<string, PageMetadata>();
		pages.forEach((page, url) => {
			const cleanedLinks = page.outgoingLinks.filter(
				(link) => !allNoiseLinks.has(link.href),
			);

			cleanedPages.set(url, {
				...page,
				outgoingLinks: cleanedLinks,
			});
		});

		const totalLinksBefore = Array.from(pages.values()).reduce(
			(sum, p) => sum + p.outgoingLinks.length,
			0,
		);
		const totalLinksAfter = Array.from(cleanedPages.values()).reduce(
			(sum, p) => sum + p.outgoingLinks.length,
			0,
		);

		console.log(`\n📊 Noise Reduction Summary:`);
		console.log(`   Total links before: ${totalLinksBefore}`);
		console.log(`   Total links after: ${totalLinksAfter}`);
		console.log(
			`   Links removed: ${totalLinksBefore - totalLinksAfter} (${((1 - totalLinksAfter / totalLinksBefore) * 100).toFixed(1)}%)`,
		);
		console.log(`   Noise categories:`);
		console.log(`   - Global navigation: ${globalNav.size}`);
		console.log(`   - Structural (footer): ${structuralNoise.size}`);
		console.log(`   - Low value: ${lowValueLinks.size}`);
		console.log(`   Hub pages: ${hubPages.size}`);

		// Safety check: if we removed too much (>90%), be less aggressive
		if (totalLinksAfter < totalLinksBefore * 0.1) {
			console.log(
				`\n⚠️  Warning: Noise reduction too aggressive (${((1 - totalLinksAfter / totalLinksBefore) * 100).toFixed(1)}% removed)`,
			);
			console.log(
				`   Falling back to conservative filtering (only low-value links)...`,
			);

			// Only remove low value links
			const conservativeNoise = new Set([...lowValueLinks]);

			const conservativeCleanedPages = new Map<string, PageMetadata>();
			pages.forEach((page, url) => {
				const cleanedLinks = page.outgoingLinks.filter(
					(link) => !conservativeNoise.has(link.href),
				);
				conservativeCleanedPages.set(url, {
					...page,
					outgoingLinks: cleanedLinks,
				});
			});

			const conservativeTotalAfter = Array.from(
				conservativeCleanedPages.values(),
			).reduce((sum, p) => sum + p.outgoingLinks.length, 0);
			console.log(
				`   Conservative cleanup: ${conservativeTotalAfter} links retained (${((1 - conservativeTotalAfter / totalLinksBefore) * 100).toFixed(1)}% removed)`,
			);

			return {
				cleanedPages: conservativeCleanedPages,
				noiseLinks: conservativeNoise,
				noiseCategories,
				globalNavigation: globalNav,
				hubPages,
			};
		}

		return {
			cleanedPages,
			noiseLinks: allNoiseLinks,
			noiseCategories,
			globalNavigation: globalNav,
			hubPages,
		};
	}
}

/**
 * Information about a navigation link
 */
export interface NavigationInfo {
	url: string;
	frequency: number;
	appearingOnPages: number;
	totalPages: number;
	linkText: string;
	positions: LinkPosition[];
	isStructural: boolean;
	isGlobalNav: boolean;
}

/**
 * Result of noise reduction
 */
export interface NoiseReductionResult {
	cleanedPages: Map<string, PageMetadata>;
	noiseLinks: Set<string>;
	noiseCategories: Map<string, string[]>;
	globalNavigation: Map<string, NavigationInfo>;
	hubPages: Set<string>;
}
