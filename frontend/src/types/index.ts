export interface CrawlRequest {
	startUrl: string;
	maxDepth?: number;
	maxPages?: number;
	credentials?: {
		username: string;
		password: string;
		loginUrl?: string;
	};
	constraints?: {
		maxCrawlDurationMs?: number;
		requestTimeoutMs?: number;
		navigationTimeoutMs?: number;
		maxConcurrency?: number;
		minTimeBetweenRequestsMs?: number;
		maxLinksPerPage?: number;
		followExternalLinks?: boolean;
		excludeFileExtensions?: string[];
		blockedPathPatterns?: string[];
		allowedPathPatterns?: string[];
		headless?: boolean;
		userAgent?: string;
		maxRetries?: number;
	};
}

export interface FlowNode {
	id: string;
	label: string;
	url: string;
	type: "entry" | "content" | "form" | "transaction" | "exit";
	depth: number;
	pageTitle: string;
}

export interface FlowEdge {
	id: string;
	source: string;
	target: string;
	weight: number;
	label?: string;
}

export interface CrawlResponse {
	graph: {
		nodes: FlowNode[];
		edges: FlowEdge[];
	};
	metadata: {
		startUrl: string;
		totalPages: number;
		noiseFiltered: number;
		crawlTimestamp: string;
		crawlDuration: number;
	};
	statistics: {
		nodesByType: Record<string, number>;
		averageDepth: number;
		maxDepth: number;
		totalEdges: number;
	};
}
