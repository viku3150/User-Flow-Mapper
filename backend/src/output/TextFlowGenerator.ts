import { UserFlow, FlowNode, FlowEdge } from "../analyzer/types";

/**
 * Generates text-based user flow diagrams in multiple formats
 */
export class TextFlowGenerator {
	/**
	 * Generate simple text outline
	 */
	generateTextOutline(flow: UserFlow): string {
		const lines: string[] = [];
		lines.push("═══════════════════════════════════════════════");
		lines.push("         INTELLIGENT USER FLOW MAP");
		lines.push("═══════════════════════════════════════════════");
		lines.push("");
		lines.push(`Total Nodes: ${flow.nodes.length}`);
		lines.push(`Total Edges: ${flow.edges.length}`);
		lines.push(`Start URL: ${flow.metadata.startUrl}`);
		lines.push("");
		lines.push("───────────────────────────────────────────────");
		lines.push("USER FLOWS:");
		lines.push("───────────────────────────────────────────────");
		lines.push("");

		// Find entry points
		const entryNodes = flow.nodes.filter((n) => n.type === "entry");

		entryNodes.forEach((entry, index) => {
			lines.push(`Flow ${index + 1}: ${entry.label}`);
			this.tracePathFromNode(entry, flow, lines, 1, new Set());
			lines.push("");
		});

		return lines.join("\n");
	}

	/**
	 * Helper: Trace path from a node recursively
	 */
	private tracePathFromNode(
		node: FlowNode,
		flow: UserFlow,
		lines: string[],
		indent: number,
		visited: Set<string>,
	): void {
		if (visited.has(node.id)) return;
		visited.add(node.id);

		const outgoing = flow.edges.filter((e) => e.source === node.id);
		outgoing.forEach((edge) => {
			const target = flow.nodes.find((n) => n.id === edge.target);
			if (target) {
				const prefix = "  ".repeat(indent) + "↓";
				const label = edge.label ? ` [${edge.label}]` : "";
				lines.push(`${prefix} ${target.label}${label}`);
				this.tracePathFromNode(target, flow, lines, indent + 1, visited);
			}
		});
	}

	/**
	 * Helper: Get icon for node type
	 */
	private getNodeIcon(type: string): string {
		switch (type) {
			case "entry":
				return "🏠";
			case "form":
				return "📝";
			case "transaction":
				return "💳";
			case "exit":
				return "✓";
			default:
				return "📄";
		}
	}

	/**
	 * Helper: Sanitize ID for diagram formats
	 */
	private sanitizeId(id: string): string {
		return "node_" + id.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
	}
}
