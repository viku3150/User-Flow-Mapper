"use client";

import { useState } from "react";

export default function DebugPage() {
	const [result, setResult] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	const testCrawl = async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/crawl", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					startUrl: "https://example.com",
					maxDepth: 2,
					maxPages: 10,
				}),
			});

			const data = await response.json();
			setResult(data);
		} catch (error: any) {
			setResult({ error: error.message });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">Debug Crawler API</h1>
			<button
				onClick={testCrawl}
				disabled={loading}
				className="bg-blue-600 text-white px-6 py-2 rounded">
				{loading ? "Testing..." : "Test Crawl"}
			</button>

			{result && (
				<pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
					{JSON.stringify(result, null, 2)}
				</pre>
			)}
		</div>
	);
}
