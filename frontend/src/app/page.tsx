"use client";

import { useState } from "react";
import CrawlerForm from "@/components/CrawlerForm";
import FlowVisualization from "@/components/FlowVisualization";
import { CrawlRequest, CrawlResponse } from "@/types";
import axios from "axios";

export default function Home() {
	const [crawlData, setCrawlData] = useState<CrawlResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCrawl = async (config: CrawlRequest) => {
		setIsLoading(true);
		setError(null);

		try {
			console.log("Starting crawl with config:", config);
			const response = await axios.post<CrawlResponse>("/api/crawl", config);
			console.log("Crawl response:", response.data);
			console.log("Nodes:", response.data.graph?.nodes);
			console.log("Edges:", response.data.graph?.edges);
			setCrawlData(response.data);
		} catch (err: any) {
			const errorMessage =
				err.response?.data?.error || err.message || "Failed to crawl website";
			setError(errorMessage);
			console.error("Crawl error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen p-8">
			<div className="max-w-[1600px] mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Intelligent User Flow Mapper
					</h1>
					<p className="text-gray-600">
						Analyze websites and visualize meaningful user navigation paths
					</p>
				</div>

				<div
					className="flex gap-6"
					style={{ height: "calc(100vh - 200px)" }}>
					<CrawlerForm
						onCrawl={handleCrawl}
						isLoading={isLoading}
					/>

					<div className="flex-1 relative">
						{error && (
							<div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg">
								<p className="font-semibold">Error</p>
								<p className="text-sm">{error}</p>
							</div>
						)}

						{isLoading && (
							<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
								<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
							</div>
						)}

						<div className="bg-gray-100 rounded-lg p-6 h-full">
							<h2 className="text-xl font-bold text-gray-800 mb-4">
								Detected User Flows
							</h2>
							<div className="h-[calc(100%-3rem)]">
								<FlowVisualization data={crawlData} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
