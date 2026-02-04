import { CrawlConfig, CrawlConfigValidator } from "./config/CrawlConfig";
import { PageCrawler } from "./crawler/PageCrawler";
import { FlowAnalyzer } from "./analyzer/FlowAnalyzer";
import { FlowFormatter } from "./output/FlowFormatter";
import { TextFlowGenerator } from "./output/TextFlowGenerator";
import * as fs from "fs";
import * as path from "path";

export class UserFlowMapper {
	private pageCrawler: PageCrawler;
	private flowAnalyzer: FlowAnalyzer;
	private flowFormatter: FlowFormatter;
	private textFlowGenerator: TextFlowGenerator;

	constructor() {
		this.pageCrawler = new PageCrawler();
		this.flowAnalyzer = new FlowAnalyzer();
		this.flowFormatter = new FlowFormatter();
		this.textFlowGenerator = new TextFlowGenerator();
	}

	async mapUserFlow(config: Partial<CrawlConfig>): Promise<string> {
		const validatedConfig = CrawlConfigValidator.validate(config);

		console.log("🚀 Starting Intelligent User Flow Mapper");
		console.log(`📍 Start URL: ${validatedConfig.startUrl}`);
		console.log(
			`📊 Max Depth: ${validatedConfig.maxDepth}, Max Pages: ${validatedConfig.maxPages}`,
		);

		// Log constraints
		if (validatedConfig.constraints) {
			console.log("\n⚙️  Constraints:");
			console.log(
				`   Max Duration: ${validatedConfig.constraints.maxCrawlDurationMs}ms`,
			);
			console.log(
				`   Concurrency: ${validatedConfig.constraints.maxConcurrency}`,
			);
			console.log(
				`   Max Links/Page: ${validatedConfig.constraints.maxLinksPerPage}`,
			);
			if (validatedConfig.constraints.allowedPathPatterns) {
				console.log(
					`   Allowed Patterns: ${validatedConfig.constraints.allowedPathPatterns.length}`,
				);
			}
			if (validatedConfig.constraints.blockedPathPatterns) {
				console.log(
					`   Blocked Patterns: ${validatedConfig.constraints.blockedPathPatterns.length}`,
				);
			}
		}

		const startTime = Date.now();

		try {
			console.log("\n🕷️  Crawling website...");
			console.log("   (This may take 1-2 minutes, press Ctrl+C to stop)\n");

			const pages = await this.pageCrawler.crawl(validatedConfig);

			if (pages.size === 0) {
				throw new Error(
					"No pages were crawled. The website may be blocking automated access.",
				);
			}

			console.log(`✅ Crawled ${pages.size} pages`);

			console.log("\n🔍 Analyzing user flows...");
			const userFlow = this.flowAnalyzer.analyze(
				pages,
				validatedConfig.startUrl,
			);

			const crawlDuration = Date.now() - startTime;
			const output = this.flowFormatter.format(userFlow, crawlDuration);
			const jsonOutput = this.flowFormatter.toJSON(output);

			console.log("\n📊 Generating diagrams...");
			const textOutline = this.textFlowGenerator.generateTextOutline(userFlow);

			console.log(`\n✨ Completed in ${(crawlDuration / 1000).toFixed(2)}s`);
			console.log("\n" + textOutline);

			const outputDir = process.cwd();
			fs.writeFileSync(
				path.join(outputDir, "user-flow-output.json"),
				jsonOutput,
			);
			fs.writeFileSync(
				path.join(outputDir, "user-flow-diagram.txt"),
				textOutline,
			);

			return jsonOutput;
		} catch (error) {
			console.error("❌ Error during crawling:", error);
			throw error;
		}
	}
}

// CLI with constraints support
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		process.exit(1);
	}

	let config: Partial<CrawlConfig>;

	// Check for config file
	const configArg = args.find((arg) => arg.startsWith("--config="));
	if (configArg) {
		const configPath = configArg.split("=")[1];
		const configFile = fs.readFileSync(configPath, "utf-8");
		config = JSON.parse(configFile);
	} else {
		config = {
			startUrl: args[0],
			maxDepth: args[1] ? parseInt(args[1]) : 3,
			maxPages: args[2] ? parseInt(args[2]) : 50,
		};
	}

	const mapper = new UserFlowMapper();

	let isShuttingDown = false;
	process.on("SIGINT", () => {
		if (isShuttingDown) {
			console.log("\n\n🛑 Force quit");
			process.exit(1);
		}
		isShuttingDown = true;
		console.log("\n\n⏸️  Stopping crawl... (press Ctrl+C again to force quit)");
		setTimeout(() => {
			console.log("⏱️  Timeout reached, forcing quit");
			process.exit(1);
		}, 5000);
	});

	try {
		const output = await mapper.mapUserFlow(config);
		const outputPath = path.join(process.cwd(), "user-flow-output.json");
		fs.writeFileSync(outputPath, output);
		console.log(`\n💾 Output saved to: ${outputPath}`);
		process.exit(0);
	} catch (error) {
		console.error("\n❌ Fatal error:", error);
		process.exit(1);
	}
}

if (require.main === module) {
	main().catch((error) => {
		console.error("Unhandled error:", error);
		process.exit(1);
	});
}

export { CrawlConfig } from "./config/CrawlConfig";
