"use client";

import { useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
	Node,
	Edge,
	Controls,
	Background,
	useNodesState,
	useEdgesState,
	MarkerType,
	Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { CrawlResponse } from "@/types";

interface FlowVisualizationProps {
	data: CrawlResponse | null;
}

export default function FlowVisualization({ data }: FlowVisualizationProps) {
	// Convert crawler output to React Flow format
	const { initialNodes, initialEdges } = useMemo(() => {
		console.log("=== FlowVisualization Processing ===");
		console.log("Raw data:", data);

		if (!data) {
			console.log("No data provided");
			return { initialNodes: [], initialEdges: [] };
		}

		if (!data.graph) {
			console.log("No graph in data");
			return { initialNodes: [], initialEdges: [] };
		}

		if (!data.graph.nodes || data.graph.nodes.length === 0) {
			console.log("No nodes in graph");
			return { initialNodes: [], initialEdges: [] };
		}

		console.log("Number of nodes:", data.graph.nodes.length);
		console.log("Number of edges:", data.graph.edges?.length || 0);
		console.log("Sample node:", data.graph.nodes[0]);
		console.log("Sample edge:", data.graph.edges?.[0]);

		// Group nodes by depth for hierarchical layout
		const nodesByDepth: Map<number, typeof data.graph.nodes> = new Map();
		data.graph.nodes.forEach((node) => {
			const depth = node.depth || 0;
			if (!nodesByDepth.has(depth)) {
				nodesByDepth.set(depth, []);
			}
			nodesByDepth.get(depth)!.push(node);
		});

		console.log(
			"Nodes grouped by depth:",
			Array.from(nodesByDepth.entries()).map(([d, nodes]) => ({
				depth: d,
				count: nodes.length,
			})),
		);

		// Calculate positions
		const nodes: Node[] = [];
		const horizontalSpacing = 250;
		const verticalSpacing = 180;

		// Sort depths for consistent ordering
		const sortedDepths = Array.from(nodesByDepth.keys()).sort((a, b) => a - b);

		sortedDepths.forEach((depth) => {
			const nodesAtDepth = nodesByDepth.get(depth)!;
			const totalNodesAtDepth = nodesAtDepth.length;

			nodesAtDepth.forEach((node, index) => {
				const xOffset =
					(index - (totalNodesAtDepth - 1) / 2) * horizontalSpacing;
				const yPosition = depth * verticalSpacing;

				// Determine node color based on type
				let bgColor = "#f3f4f6"; // default gray
				let borderColor = "#d1d5db";

				switch (node.type) {
					case "entry":
						bgColor = "#dbeafe"; // blue
						borderColor = "#3b82f6";
						break;
					case "form":
						bgColor = "#fef3c7"; // yellow
						borderColor = "#f59e0b";
						break;
					case "transaction":
						bgColor = "#fce7f3"; // pink
						borderColor = "#ec4899";
						break;
					case "exit":
						bgColor = "#d1fae5"; // green
						borderColor = "#10b981";
						break;
				}

				const reactFlowNode: Node = {
					id: node.id,
					type: "default",
					position: { x: xOffset, y: yPosition },
					data: {
						label: (
							<div className="text-center px-2">
								<div
									className="font-semibold text-sm"
									style={{
										maxWidth: "200px",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}>
									{node.label || node.pageTitle || "Untitled"}
								</div>
								<div className="text-xs text-gray-500 mt-1">{node.type}</div>
							</div>
						),
					},
					style: {
						backgroundColor: bgColor,
						border: `2px solid ${borderColor}`,
						borderRadius: "8px",
						padding: "12px 16px",
						minWidth: "140px",
					},
					sourcePosition: Position.Bottom,
					targetPosition: Position.Top,
				};

				nodes.push(reactFlowNode);
			});
		});

		console.log("Generated React Flow nodes:", nodes.length);
		console.log("Sample generated node:", nodes[0]);

		// Create edges with labels
		const edges: Edge[] = [];

		if (data.graph.edges && Array.isArray(data.graph.edges)) {
			data.graph.edges.forEach((edge, idx) => {
				const reactFlowEdge: Edge = {
					id: edge.id || `edge-${idx}`,
					source: edge.source,
					target: edge.target,
					label: edge.label || "",
					type: "smoothstep",
					animated: (edge.weight || 0) > 1,
					style: {
						stroke: "#94a3b8",
						strokeWidth: Math.min(edge.weight || 1, 3),
					},
					markerEnd: {
						type: MarkerType.ArrowClosed,
						color: "#94a3b8",
					},
					labelStyle: {
						fontSize: 10,
						fill: "#64748b",
					},
				};
				edges.push(reactFlowEdge);
			});
		}

		console.log("Generated React Flow edges:", edges.length);
		console.log("=== End Processing ===");

		return { initialNodes: nodes, initialEdges: edges };
	}, [data]);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	// Update nodes and edges when initialNodes/initialEdges change
	useEffect(() => {
		console.log("Updating nodes state:", initialNodes.length);
		setNodes(initialNodes);
	}, [initialNodes, setNodes]);

	useEffect(() => {
		console.log("Updating edges state:", initialEdges.length);
		setEdges(initialEdges);
	}, [initialEdges, setEdges]);

	useEffect(() => {
		console.log("Current nodes in state:", nodes.length);
		console.log("Current edges in state:", edges.length);
	}, [nodes, edges]);

	if (!data) {
		return (
			<div className="flex-1 flex items-center justify-center bg-white rounded-lg shadow-lg h-full">
				<div className="text-center text-gray-400">
					<svg
						className="w-24 h-24 mx-auto mb-4 opacity-50"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
						/>
					</svg>
					<p className="text-lg font-medium">No flow data yet</p>
					<p className="text-sm mt-2">Start a crawl to visualize user flows</p>
				</div>
			</div>
		);
	}

	return (
		<div className="relative h-full w-full bg-white rounded-lg shadow-lg overflow-hidden">
			<div className="h-full w-full">
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					fitView
					fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.5 }}
					minZoom={0.1}
					maxZoom={2}
					defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}>
					<Background
						color="#e5e7eb"
						gap={16}
					/>
					<Controls />
				</ReactFlow>
			</div>

			{/* Statistics Panel */}
			<div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-4 max-w-xs z-10">
				<h3 className="font-bold text-sm mb-3 text-gray-800">
					Crawl Statistics
				</h3>
				<div className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-gray-600">Total Pages:</span>
						<span className="font-semibold">{data.metadata.totalPages}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-600">Nodes:</span>
						<span className="font-semibold">{nodes.length}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-600">Edges:</span>
						<span className="font-semibold">{edges.length}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-600">Max Depth:</span>
						<span className="font-semibold">{data.statistics.maxDepth}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-600">Noise Filtered:</span>
						<span className="font-semibold">{data.metadata.noiseFiltered}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-600">Duration:</span>
						<span className="font-semibold">
							{(data.metadata.crawlDuration / 1000).toFixed(1)}s
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
