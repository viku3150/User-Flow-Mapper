export interface FlowNode {
	id: string;
	label: string;
	url: string;
	type: NodeType;
	metadata: {
		depth: number;
		pageTitle: string;
		pathSegments: string[];
	};
}

export enum NodeType {
	ENTRY = "entry",
	CONTENT = "content",
	FORM = "form",
	TRANSACTION = "transaction",
	EXIT = "exit",
}

export interface FlowEdge {
	source: string;
	target: string;
	weight: number;
	label?: string;
}

export interface FlowPath {
	pages: string[];
	type: string;
}

export interface UserFlow {
	nodes: FlowNode[];
	edges: FlowEdge[];
	metadata: {
		startUrl: string;
		totalPages: number;
		noiseFiltered: number;
		crawlTimestamp: number;
	};
}
