"use client";

import { useState } from "react";
import { CrawlRequest } from "@/types";
import AdvancedSettings from "./AdvancedSettings";

interface CrawlerFormProps {
	onCrawl: (config: CrawlRequest) => void;
	isLoading: boolean;
}

export default function CrawlerForm({ onCrawl, isLoading }: CrawlerFormProps) {
	const [url, setUrl] = useState("https://example.com");
	const [showAuth, setShowAuth] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loginUrl, setLoginUrl] = useState("");

	const [constraints, setConstraints] = useState({
		maxDepth: 3,
		maxPages: 50,
		maxCrawlDurationMs: 180000,
		maxConcurrency: 3,
		maxLinksPerPage: 50,
		excludeFileExtensions: [".pdf", ".zip", ".jpg", ".png", ".gif", ".svg"],
		followExternalLinks: false,
		headless: true,
		minTimeBetweenRequestsMs: 100,
		maxRetries: 2,
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const config: CrawlRequest = {
			startUrl: url,
			maxDepth: constraints.maxDepth,
			maxPages: constraints.maxPages,
			constraints,
		};

		if (showAuth && username && password) {
			config.credentials = {
				username,
				password,
				loginUrl: loginUrl || undefined,
			};
		}

		onCrawl(config);
	};

	return (
		<div className="w-80 bg-white rounded-lg shadow-lg p-6 max-h-[calc(100vh-180px)] overflow-y-auto">
			<form
				onSubmit={handleSubmit}
				className="space-y-6">
				{/* Website URL Input */}
				<div>
					<label className="block text-sm font-semibold text-gray-700 mb-2">
						Website URL
					</label>
					<input
						type="url"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="https://example.com"
						required
						className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
					/>
				</div>

				{/* Quick Settings */}
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="block text-xs text-gray-600 mb-1">
							Max Depth
						</label>
						<input
							type="number"
							value={constraints.maxDepth}
							onChange={(e) =>
								setConstraints({
									...constraints,
									maxDepth: parseInt(e.target.value),
								})
							}
							min="1"
							max="10"
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
						/>
					</div>
					<div>
						<label className="block text-xs text-gray-600 mb-1">
							Max Pages
						</label>
						<input
							type="number"
							value={constraints.maxPages}
							onChange={(e) =>
								setConstraints({
									...constraints,
									maxPages: parseInt(e.target.value),
								})
							}
							min="1"
							max="500"
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
						/>
					</div>
				</div>

				{/* Start Crawl Button */}
				<button
					type="submit"
					disabled={isLoading}
					className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md">
					{isLoading ? (
						<span className="flex items-center justify-center">
							<svg
								className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24">
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Crawling...
						</span>
					) : (
						"Start Crawl"
					)}
				</button>

				{/* Advanced Settings */}
				<AdvancedSettings
					constraints={constraints}
					onChange={setConstraints}
				/>

				{/* Authentication Section */}
				<div className="pt-4 border-t border-gray-200">
					<button
						type="button"
						onClick={() => setShowAuth(!showAuth)}
						className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 hover:text-gray-900">
						<span>🔐 Authenticated Access (Optional)</span>
						<svg
							className={`w-4 h-4 transition-transform ${showAuth ? "rotate-180" : ""}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>

					{showAuth && (
						<div className="mt-4 space-y-3">
							<input
								type="url"
								value={loginUrl}
								onChange={(e) => setLoginUrl(e.target.value)}
								placeholder="Login URL (optional)"
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
							/>
							<input
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="Username or Email"
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
							/>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Password"
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
							/>
						</div>
					)}
				</div>
			</form>
		</div>
	);
}
