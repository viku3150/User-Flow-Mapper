/**
 * Configuration for crawl behavior and constraints
 */
export interface CrawlConfig {
	startUrl: string;
	maxDepth: number;
	maxPages: number;
	credentials?: {
		username: string;
		password: string;
		loginUrl?: string;
		usernameSelector?: string;
		passwordSelector?: string;
		submitSelector?: string;
	};

	// Advanced constraints
	constraints?: {
		// Time constraints
		maxCrawlDurationMs?: number;
		requestTimeoutMs?: number;
		navigationTimeoutMs?: number;

		// Rate limiting
		maxConcurrency?: number;
		minTimeBetweenRequestsMs?: number;
		maxRequestsPerMinute?: number;

		// URL filtering
		allowedDomains?: string[];
		blockedDomains?: string[];
		allowedPathPatterns?: RegExp[];
		blockedPathPatterns?: RegExp[];

		// Content filtering
		excludeFileExtensions?: string[];
		includeOnlyContentTypes?: string[];

		// Link filtering
		maxLinksPerPage?: number;
		followExternalLinks?: boolean;

		// Browser behavior
		headless?: boolean;
		userAgent?: string;
		viewport?: { width: number; height: number };

		// Retry behavior
		maxRetries?: number;
		retryStatusCodes?: number[];
	};

	// Legacy fields for backward compatibility
	timeout?: number;
	userAgent?: string;
	respectRobotsTxt?: boolean;
}

export class CrawlConfigValidator {
	private static readonly DEFAULT_CONSTRAINTS = {
		maxCrawlDurationMs: 300000, // 5 minutes
		requestTimeoutMs: 30000, // 30 seconds
		navigationTimeoutMs: 30000, // 30 seconds
		maxConcurrency: 3,
		minTimeBetweenRequestsMs: 100,
		maxRequestsPerMinute: 60,
		excludeFileExtensions: [
			".pdf",
			".zip",
			".exe",
			".dmg",
			".jpg",
			".jpeg",
			".png",
			".gif",
			".svg",
			".ico",
		],
		maxLinksPerPage: 50,
		followExternalLinks: false,
		headless: true,
		maxRetries: 2,
		retryStatusCodes: [429, 500, 502, 503, 504],
	};

	static validate(config: Partial<CrawlConfig>): CrawlConfig {
		if (!config.startUrl) {
			throw new Error("startUrl is required");
		}

		try {
			new URL(config.startUrl);
		} catch {
			throw new Error("startUrl must be a valid URL");
		}

		const validated: CrawlConfig = {
			startUrl: config.startUrl,
			maxDepth: config.maxDepth ?? 3,
			maxPages: config.maxPages ?? 50,
			credentials: config.credentials,
			timeout: config.timeout ?? 30000,
			userAgent: config.userAgent ?? "IntelligentUserFlowMapper/1.0",
			respectRobotsTxt: config.respectRobotsTxt ?? true,
			constraints: {
				...this.DEFAULT_CONSTRAINTS,
				...config.constraints,
			},
		};

		// Validate constraints
		this.validateConstraints(validated.constraints!);

		return validated;
	}

	private static validateConstraints(
		constraints: NonNullable<CrawlConfig["constraints"]>,
	): void {
		if (constraints.maxConcurrency && constraints.maxConcurrency < 1) {
			throw new Error("maxConcurrency must be at least 1");
		}

		if (
			constraints.maxCrawlDurationMs &&
			constraints.maxCrawlDurationMs < 1000
		) {
			throw new Error("maxCrawlDurationMs must be at least 1000ms (1 second)");
		}

		if (constraints.maxLinksPerPage && constraints.maxLinksPerPage < 1) {
			throw new Error("maxLinksPerPage must be at least 1");
		}
	}
}

export interface CrawlConstraints {
	shouldCrawlUrl(url: string): boolean;
	shouldFollowLink(link: string, fromUrl: string): boolean;
	getRequestDelay(): number;
	hasExceededTimeLimit(startTime: number): boolean;
}

export class CrawlConstraintsImpl implements CrawlConstraints {
	constructor(private config: CrawlConfig) {}

	shouldCrawlUrl(url: string): boolean {
		const constraints = this.config.constraints;
		if (!constraints) return true;

		try {
			const urlObj = new URL(url);

			// Check file extensions
			if (constraints.excludeFileExtensions) {
				const hasExcludedExtension = constraints.excludeFileExtensions.some(
					(ext) => urlObj.pathname.toLowerCase().endsWith(ext.toLowerCase()),
				);
				if (hasExcludedExtension) return false;
			}

			// Check allowed domains
			if (constraints.allowedDomains && constraints.allowedDomains.length > 0) {
				const isAllowed = constraints.allowedDomains.some(
					(domain) =>
						urlObj.hostname === domain ||
						urlObj.hostname.endsWith("." + domain),
				);
				if (!isAllowed) return false;
			}

			// Check blocked domains
			if (constraints.blockedDomains) {
				const isBlocked = constraints.blockedDomains.some(
					(domain) =>
						urlObj.hostname === domain ||
						urlObj.hostname.endsWith("." + domain),
				);
				if (isBlocked) return false;
			}

			// Check allowed path patterns
			if (
				constraints.allowedPathPatterns &&
				constraints.allowedPathPatterns.length > 0
			) {
				const matchesAllowed = constraints.allowedPathPatterns.some((pattern) =>
					pattern.test(urlObj.pathname),
				);
				if (!matchesAllowed) return false;
			}

			// Check blocked path patterns
			if (constraints.blockedPathPatterns) {
				const matchesBlocked = constraints.blockedPathPatterns.some((pattern) =>
					pattern.test(urlObj.pathname),
				);
				if (matchesBlocked) return false;
			}

			return true;
		} catch (error) {
			return false;
		}
	}

	shouldFollowLink(link: string, fromUrl: string): boolean {
		const constraints = this.config.constraints;
		if (!constraints) return true;

		try {
			const linkUrl = new URL(link);
			const fromUrlObj = new URL(fromUrl);

			// Check if external link
			if (!constraints.followExternalLinks) {
				if (linkUrl.hostname !== fromUrlObj.hostname) {
					return false;
				}
			}

			return this.shouldCrawlUrl(link);
		} catch (error) {
			return false;
		}
	}

	getRequestDelay(): number {
		const constraints = this.config.constraints;
		if (!constraints?.minTimeBetweenRequestsMs) return 0;

		return constraints.minTimeBetweenRequestsMs;
	}

	hasExceededTimeLimit(startTime: number): boolean {
		const constraints = this.config.constraints;
		if (!constraints?.maxCrawlDurationMs) return false;

		return Date.now() - startTime > constraints.maxCrawlDurationMs;
	}
}
