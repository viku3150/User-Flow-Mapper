/**
 * Output format optimized for frontend visualization
 * Compatible with D3.js, Cytoscape.js, React Flow, etc.
 */
export interface FlowVisualizationOutput {
	graph: {
		nodes: VisualizationNode[];
		edges: VisualizationEdge[];
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

export interface VisualizationNode {
	id: string;
	label: string;
	url: string;
	type: string;
	depth: number;
	pageTitle: string;
}

export interface VisualizationEdge {
	id: string;
	source: string;
	target: string;
	weight: number;
	label?: string;
}
