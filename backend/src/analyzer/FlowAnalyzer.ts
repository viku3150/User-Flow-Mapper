import { PageMetadata, Link } from "../crawler/types";
import { FlowNode, FlowEdge, UserFlow, NodeType } from "./types";
import { NoiseReducer, NoiseReductionResult } from "./NoiseReducer";
import { UrlUtils } from "../utils/UrlUtils";

/**
 * Analyzes crawled pages and generates meaningful user flow representation
 * Focus: Extract PRIMARY navigation paths, not comprehensive site maps
 */
export class FlowAnalyzer {
	private noiseReducer: NoiseReducer;
	private readonly MAX_NODES_IN_FLOW = 30; // Increased from 25

	constructor() {
		this.noiseReducer = new NoiseReducer();
	}

	/**
	 * Calculate page importance based on multiple factors
	 */
	private calculatePageImportance(
		url: string,
		page: PageMetadata,
		allPages: Map<string, PageMetadata>,
		incomingLinks: Map<string, number>,
		noiseResult: NoiseReductionResult,
	): number {
		let score = 0;

		// Factor 1: Incoming links (popularity) - but not if it's a hub page
		const incoming = incomingLinks.get(url) || 0;
		if (!noiseResult.hubPages.has(url)) {
			score += incoming * 15; // Increased weight
		} else {
			// Hub pages get a moderate boost
			score += 40;
		}

		// Factor 2: Low depth (closer to home) - higher weight
		score += (6 - Math.min(page.depth, 6)) * 10;

		// Factor 3: Number of meaningful outgoing links (not noise)
		const cleanedPage = noiseResult.cleanedPages.get(url);
		if (cleanedPage && cleanedPage.outgoingLinks.length > 0) {
			score += Math.min(cleanedPage.outgoingLinks.length, 15) * 4;
		}

		// Factor 4: URL patterns indicating importance - higher weights
		const urlLower = url.toLowerCase();
		if (urlLower.match(/\/(home|index|dashboard|main)$/)) score += 100;
		if (urlLower.match(/\/(login|signup|register|auth)/)) score += 80;
		if (urlLower.match(/\/(checkout|cart|payment|order)/)) score += 80;
		if (urlLower.match(/\/(product|item|detail)/)) score += 60;
		if (urlLower.match(/\/(contact|support|help)/)) score += 50;
		if (urlLower.match(/\/(profile|account|settings)/)) score += 60;
		if (urlLower.match(/\/(search|results)/)) score += 50;
		if (urlLower.match(/\/(category|collection|browse)/)) score += 45;
		if (urlLower.match(/\/(about|info)/)) score += 35;

		// Factor 5: Page title keywords
		const titleLower = page.title.toLowerCase();
		if (titleLower.match(/(home|dashboard|main|overview)/)) score += 40;
		if (titleLower.match(/(login|sign in|register|sign up)/)) score += 40;
		if (titleLower.match(/(checkout|cart|payment)/)) score += 40;
		if (titleLower.match(/(product|item|detail)/)) score += 30;
		if (titleLower.match(/(category|collection)/)) score += 25;

		// Factor 6: Less penalty for being in global nav
		if (noiseResult.globalNavigation.has(url)) {
			score *= 0.7; // Only 30% reduction instead of 50%
		}

		// Base score for all pages
		score += 10;

		return score;
	}

	/**
	 * Build incoming links map (excluding global navigation)
	 */
	private buildIncomingLinksMap(
		pages: Map<string, PageMetadata>,
		noiseResult: NoiseReductionResult,
	): Map<string, number> {
		const incomingLinks = new Map<string, number>();

		// Use cleaned pages (without noise)
		noiseResult.cleanedPages.forEach((page) => {
			page.outgoingLinks.forEach((link) => {
				// Don't count links to global navigation pages
				if (!noiseResult.globalNavigation.has(link.href)) {
					incomingLinks.set(link.href, (incomingLinks.get(link.href) || 0) + 1);
				}
			});
		});

		return incomingLinks;
	}

	/**
	 * Identify key pages that should be in the flow
	 */
	private identifyKeyPages(
		pages: Map<string, PageMetadata>,
		noiseResult: NoiseReductionResult,
		incomingLinks: Map<string, number>,
	): Set<string> {
		const pageScores = new Map<string, number>();

		// Calculate importance for each page
		pages.forEach((page, url) => {
			const score = this.calculatePageImportance(
				url,
				page,
				pages,
				incomingLinks,
				noiseResult,
			);
			pageScores.set(url, score);
		});

		// Sort by score
		const sortedPages = Array.from(pageScores.entries()).sort(
			(a, b) => b[1] - a[1],
		);

		console.log("\n📊 Top 15 Important Pages:");
		sortedPages.slice(0, 15).forEach(([url, score], idx) => {
			const page = pages.get(url);
			const displayTitle = page?.title || url;
			const truncatedTitle =
				displayTitle.length > 50
					? displayTitle.substring(0, 47) + "..."
					: displayTitle;
			console.log(
				`   ${idx + 1}. ${truncatedTitle} (score: ${score.toFixed(1)})`,
			);
		});

		// Adaptive selection based on available pages
		// Select at least 30% of pages, minimum 10, maximum MAX_NODES_IN_FLOW
		const minNodes = 10;
		const targetNodeCount = Math.max(
			minNodes,
			Math.min(
				this.MAX_NODES_IN_FLOW,
				Math.ceil(pages.size * 0.3), // 30% of pages
			),
		);

		const keyPages = new Set<string>();
		const topPages = sortedPages.slice(0, targetNodeCount);

		topPages.forEach(([url]) => keyPages.add(url));

		// Always include start page
		const startPage = Array.from(pages.keys())[0];
		if (startPage) {
			keyPages.add(startPage);
		}

		// Safety check: ensure we have at least some pages
		if (keyPages.size < 5 && pages.size >= 5) {
			console.log(
				`\n⚠️  Too few key pages selected (${keyPages.size}), adding more...`,
			);
			sortedPages
				.slice(0, Math.min(15, pages.size))
				.forEach(([url]) => keyPages.add(url));
		}

		console.log(
			`\n✨ Key pages selected: ${keyPages.size} out of ${pages.size} (${((keyPages.size / pages.size) * 100).toFixed(1)}%)`,
		);

		return keyPages;
	}

	/**
	 * Infer node type based on URL patterns and content
	 */
	private inferNodeType(url: string, pageTitle: string): NodeType {
		const urlLower = url.toLowerCase();
		const titleLower = pageTitle.toLowerCase();

		// Entry points
		if (
			urlLower.endsWith("/") ||
			urlLower.includes("/home") ||
			urlLower.includes("/index") ||
			urlLower.includes("/dashboard")
		) {
			return NodeType.ENTRY;
		}

		// Forms and interactions
		if (
			urlLower.includes("/login") ||
			urlLower.includes("/signup") ||
			urlLower.includes("/register") ||
			urlLower.includes("/contact")
		) {
			return NodeType.FORM;
		}

		// Transaction pages
		if (
			urlLower.includes("/checkout") ||
			urlLower.includes("/payment") ||
			urlLower.includes("/cart") ||
			urlLower.includes("/order")
		) {
			return NodeType.TRANSACTION;
		}

		// Exit pages
		if (
			urlLower.includes("/thank") ||
			urlLower.includes("/success") ||
			urlLower.includes("/confirm") ||
			urlLower.includes("/complete")
		) {
			return NodeType.EXIT;
		}

		// Default to content
		return NodeType.CONTENT;
	}

	/**
	 * Generate human-readable label for a node
	 */
	private generateNodeLabel(url: string, pageTitle: string): string {
		// Prefer page title if meaningful
		if (pageTitle && pageTitle.length > 0 && pageTitle.length < 50) {
			return pageTitle;
		}

		// Fallback to URL-based label
		const segments = UrlUtils.getPathSegments(url);
		if (segments.length === 0) {
			return "Home";
		}

		// Use last meaningful segment
		const lastSegment = segments[segments.length - 1];
		return lastSegment
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	}

	/**
	 * Build flow nodes from key pages only
	 */
	private buildNodes(
		pages: Map<string, PageMetadata>,
		keyPages: Set<string>,
	): Map<string, FlowNode> {
		const nodes = new Map<string, FlowNode>();

		keyPages.forEach((url) => {
			const page = pages.get(url);
			if (!page) return;

			const nodeId = url;
			const label = this.generateNodeLabel(url, page.title);
			const type = this.inferNodeType(url, page.title);
			const pathSegments = UrlUtils.getPathSegments(url);

			nodes.set(nodeId, {
				id: nodeId,
				label,
				url,
				type,
				metadata: {
					depth: page.depth,
					pageTitle: page.title,
					pathSegments,
				},
			});
		});

		return nodes;
	}

	/**
	 * Build edges only between key pages (no global nav edges)
	 */
	private buildEdges(
		pages: Map<string, PageMetadata>,
		keyPages: Set<string>,
		noiseResult: NoiseReductionResult,
	): FlowEdge[] {
		const edgeMap = new Map<string, { count: number; label: string }>();

		// Use cleaned pages (global nav already removed)
		noiseResult.cleanedPages.forEach((page, sourceUrl) => {
			if (!keyPages.has(sourceUrl)) return;

			page.outgoingLinks.forEach((link) => {
				// Only create edges between key pages
				if (!keyPages.has(link.href)) return;

				const edgeKey = `${sourceUrl}::${link.href}`;

				if (!edgeMap.has(edgeKey)) {
					edgeMap.set(edgeKey, { count: 0, label: link.text });
				}

				const edge = edgeMap.get(edgeKey)!;
				edge.count++;

				// Prefer shorter, more meaningful labels
				if (
					link.text &&
					link.text.length > 0 &&
					link.text.length < edge.label.length
				) {
					edge.label = link.text;
				}
			});
		});

		// Convert to edge array
		const edges: FlowEdge[] = [];
		edgeMap.forEach((data, key) => {
			const [source, target] = key.split("::");
			edges.push({
				source,
				target,
				weight: data.count,
				label: data.label,
			});
		});

		console.log(`\n🔗 Edge Creation:`);
		console.log(`   Meaningful edges created: ${edges.length}`);
		console.log(`   (Global navigation edges excluded)`);
		if (edges.length > 0) {
			console.log(
				`   Average edges per node: ${(edges.length / Array.from(keyPages).length).toFixed(2)}`,
			);
		}

		return edges;
	}

	/**
	 * Main analysis function - extract meaningful flows
	 */
	analyze(pages: Map<string, PageMetadata>, startUrl: string): UserFlow {
		console.log("\n🔍 Starting Flow Analysis...");
		console.log(`   Total pages crawled: ${pages.size}`);

		// Step 1: Apply noise reduction with global nav detection
		const noiseResult = this.noiseReducer.reduceNoise(pages);

		// Step 2: Build incoming links map (excluding noise)
		const incomingLinks = this.buildIncomingLinksMap(pages, noiseResult);

		// Step 3: Identify key pages (excluding global nav)
		const keyPages = this.identifyKeyPages(pages, noiseResult, incomingLinks);

		// Step 4: Build flow graph with only key pages, no global nav edges
		const nodes = this.buildNodes(pages, keyPages);
		const edges = this.buildEdges(pages, keyPages, noiseResult);

		console.log(`\n✅ Flow Analysis Complete`);
		console.log(`   Final flow:`);
		console.log(`   - Nodes: ${nodes.size}`);
		console.log(`   - Edges: ${edges.length}`);
		if (nodes.size > 0 && edges.length > 0) {
			console.log(
				`   - Connectivity: ${(edges.length / nodes.size).toFixed(2)} edges per node`,
			);
		}

		return {
			nodes: Array.from(nodes.values()),
			edges,
			metadata: {
				startUrl,
				totalPages: pages.size,
				noiseFiltered: noiseResult.noiseLinks.size,
				crawlTimestamp: Date.now(),
			},
		};
	}
}
