import { UserFlow } from "../analyzer/types";
import {
	FlowVisualizationOutput,
	VisualizationNode,
	VisualizationEdge,
} from "./types";

/**
 * Formats user flow into JSON structure optimized for frontend visualization
 */
export class FlowFormatter {
	/**
	 * Convert internal user flow to visualization-friendly format
	 */
	format(flow: UserFlow, crawlDuration: number): FlowVisualizationOutput {
		const nodes: VisualizationNode[] = flow.nodes.map((node) => ({
			id: node.id,
			label: node.label,
			url: node.url,
			type: node.type,
			depth: node.metadata.depth,
			pageTitle: node.metadata.pageTitle,
		}));

		const edges: VisualizationEdge[] = flow.edges.map((edge, index) => ({
			id: `edge-${index}`,
			source: edge.source,
			target: edge.target,
			weight: edge.weight,
			label: edge.label,
		}));

		// Calculate statistics
		const nodesByType: Record<string, number> = {};
		let totalDepth = 0;
		let maxDepth = 0;

		flow.nodes.forEach((node) => {
			nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
			totalDepth += node.metadata.depth;
			maxDepth = Math.max(maxDepth, node.metadata.depth);
		});

		const averageDepth =
			flow.nodes.length > 0 ? totalDepth / flow.nodes.length : 0;

		return {
			graph: { nodes, edges },
			metadata: {
				startUrl: flow.metadata.startUrl,
				totalPages: flow.metadata.totalPages,
				noiseFiltered: flow.metadata.noiseFiltered,
				crawlTimestamp: new Date(flow.metadata.crawlTimestamp).toISOString(),
				crawlDuration,
			},
			statistics: {
				nodesByType,
				averageDepth: Math.round(averageDepth * 100) / 100,
				maxDepth,
				totalEdges: edges.length,
			},
		};
	}

	toJSON(output: FlowVisualizationOutput): string {
		return JSON.stringify(output, null, 2);
	}
}
