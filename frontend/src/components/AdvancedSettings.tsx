"use client";

import { useState } from "react";

interface AdvancedSettingsProps {
	constraints: any;
	onChange: (constraints: any) => void;
}

export default function AdvancedSettings({
	constraints,
	onChange,
}: AdvancedSettingsProps) {
	const [isOpen, setIsOpen] = useState(false);

	const updateConstraint = (key: string, value: any) => {
		onChange({
			...constraints,
			[key]: value,
		});
	};

	const updateArrayConstraint = (key: string, value: string) => {
		const items = value
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean);
		onChange({
			...constraints,
			[key]: items,
		});
	};

	return (
		<div className="mt-4 pt-4 border-t border-gray-200">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 hover:text-gray-900">
				<span>⚙️ Advanced Settings</span>
				<svg
					className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
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

			{isOpen && (
				<div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
					{/* Crawl Settings */}
					<div>
						<h4 className="text-xs font-bold text-gray-700 mb-2">
							Crawl Settings
						</h4>

						<div className="space-y-3">
							<div>
								<label className="block text-xs text-gray-600 mb-1">
									Max Depth
								</label>
								<input
									type="number"
									value={constraints.maxDepth || 3}
									onChange={(e) =>
										onChange({
											...constraints,
											maxDepth: parseInt(e.target.value),
										})
									}
									min="1"
									max="10"
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs text-gray-600 mb-1">
									Max Pages
								</label>
								<input
									type="number"
									value={constraints.maxPages || 50}
									onChange={(e) =>
										onChange({
											...constraints,
											maxPages: parseInt(e.target.value),
										})
									}
									min="1"
									max="500"
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs text-gray-600 mb-1">
									Max Duration (seconds)
								</label>
								<input
									type="number"
									value={(constraints.maxCrawlDurationMs || 180000) / 1000}
									onChange={(e) =>
										updateConstraint(
											"maxCrawlDurationMs",
											parseInt(e.target.value) * 1000,
										)
									}
									min="30"
									max="600"
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs text-gray-600 mb-1">
									Concurrency
								</label>
								<input
									type="number"
									value={constraints.maxConcurrency || 3}
									onChange={(e) =>
										updateConstraint("maxConcurrency", parseInt(e.target.value))
									}
									min="1"
									max="10"
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs text-gray-600 mb-1">
									Max Links Per Page
								</label>
								<input
									type="number"
									value={constraints.maxLinksPerPage || 50}
									onChange={(e) =>
										updateConstraint(
											"maxLinksPerPage",
											parseInt(e.target.value),
										)
									}
									min="5"
									max="200"
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
								/>
							</div>
						</div>
					</div>

					{/* URL Filtering */}
					<div>
						<h4 className="text-xs font-bold text-gray-700 mb-2">
							URL Filtering
						</h4>

						<div className="space-y-3">
							<div>
								<label className="block text-xs text-gray-600 mb-1">
									Blocked Path Patterns (comma-separated)
								</label>
								<input
									type="text"
									value={constraints.blockedPathPatterns?.join(", ") || ""}
									onChange={(e) =>
										updateArrayConstraint("blockedPathPatterns", e.target.value)
									}
									placeholder="/admin, /api, /download"
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs text-gray-600 mb-1">
									Allowed Path Patterns (comma-separated)
								</label>
								<input
									type="text"
									value={constraints.allowedPathPatterns?.join(", ") || ""}
									onChange={(e) =>
										updateArrayConstraint("allowedPathPatterns", e.target.value)
									}
									placeholder="/products, /category, /about"
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs text-gray-600 mb-1">
									Exclude File Extensions (comma-separated)
								</label>
								<input
									type="text"
									value={
										constraints.excludeFileExtensions?.join(", ") ||
										".pdf, .zip, .jpg, .png"
									}
									onChange={(e) =>
										updateArrayConstraint(
											"excludeFileExtensions",
											e.target.value,
										)
									}
									placeholder=".pdf, .zip, .exe"
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
								/>
							</div>
						</div>
					</div>

					{/* Behavior Settings */}
					<div>
						<h4 className="text-xs font-bold text-gray-700 mb-2">Behavior</h4>

						<div className="space-y-3">
							<label className="flex items-center">
								<input
									type="checkbox"
									checked={constraints.followExternalLinks || false}
									onChange={(e) =>
										updateConstraint("followExternalLinks", e.target.checked)
									}
									className="mr-2"
								/>
								<span className="text-xs text-gray-600">
									Follow External Links
								</span>
							</label>

							<label className="flex items-center">
								<input
									type="checkbox"
									checked={constraints.headless !== false}
									onChange={(e) =>
										updateConstraint("headless", e.target.checked)
									}
									className="mr-2"
								/>
								<span className="text-xs text-gray-600">Headless Mode</span>
							</label>

							<div>
								<label className="block text-xs text-gray-600 mb-1">
									Custom User Agent
								</label>
								<input
									type="text"
									value={constraints.userAgent || ""}
									onChange={(e) =>
										updateConstraint("userAgent", e.target.value)
									}
									placeholder="IntelligentUserFlowMapper/1.0"
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs text-gray-600 mb-1">
									Request Delay (ms)
								</label>
								<input
									type="number"
									value={constraints.minTimeBetweenRequestsMs || 100}
									onChange={(e) =>
										updateConstraint(
											"minTimeBetweenRequestsMs",
											parseInt(e.target.value),
										)
									}
									min="0"
									max="5000"
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs text-gray-600 mb-1">
									Max Retries
								</label>
								<input
									type="number"
									value={constraints.maxRetries || 2}
									onChange={(e) =>
										updateConstraint("maxRetries", parseInt(e.target.value))
									}
									min="0"
									max="5"
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
								/>
							</div>
						</div>
					</div>

					{/* Preset Buttons */}
					<div>
						<h4 className="text-xs font-bold text-gray-700 mb-2">Presets</h4>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() =>
									onChange({
										maxDepth: 2,
										maxPages: 20,
										maxCrawlDurationMs: 60000,
										maxConcurrency: 2,
										maxLinksPerPage: 20,
									})
								}
								className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">
								🚀 Fast
							</button>
							<button
								type="button"
								onClick={() =>
									onChange({
										maxDepth: 3,
										maxPages: 50,
										maxCrawlDurationMs: 180000,
										maxConcurrency: 3,
										maxLinksPerPage: 50,
									})
								}
								className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
								⚖️ Balanced
							</button>
							<button
								type="button"
								onClick={() =>
									onChange({
										maxDepth: 5,
										maxPages: 200,
										maxCrawlDurationMs: 600000,
										maxConcurrency: 5,
										maxLinksPerPage: 100,
									})
								}
								className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200">
								🔍 Deep
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
