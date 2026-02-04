export interface PageMetadata {
	url: string;
	title: string;
	depth: number;
	outgoingLinks: Link[];
	timestamp: number;
}

export interface Link {
	href: string;
	text: string;
	position: LinkPosition;
	context: string;
}

export enum LinkPosition {
	HEADER = "header",
	NAVIGATION = "navigation",
	CONTENT = "content",
	FOOTER = "footer",
	SIDEBAR = "sidebar",
}

export interface CrawlResult {
	pages: Map<string, PageMetadata>;
	startUrl: string;
	crawlDuration: number;
	totalPagesVisited: number;
}
