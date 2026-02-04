/**
 * Utility functions for URL manipulation and normalization
 */
export class UrlUtils {
	/**
	 * Normalize URL by removing fragments, trailing slashes, and sorting query params
	 */
	static normalize(url: string): string {
		try {
			const parsed = new URL(url);

			// Remove fragment
			parsed.hash = "";

			// Sort query parameters for consistency
			const sortedParams = Array.from(parsed.searchParams.entries()).sort(
				([a], [b]) => a.localeCompare(b),
			);
			parsed.search = "";
			sortedParams.forEach(([key, value]) => {
				parsed.searchParams.append(key, value);
			});

			// Remove trailing slash
			let pathname = parsed.pathname;
			if (pathname.endsWith("/") && pathname.length > 1) {
				pathname = pathname.slice(0, -1);
			}
			parsed.pathname = pathname;

			return parsed.href;
		} catch {
			return url;
		}
	}

	/**
	 * Check if URL is internal to the base domain
	 */
	static isInternal(url: string, baseDomain: string): boolean {
		try {
			const urlObj = new URL(url);
			const baseObj = new URL(baseDomain);

			return urlObj.hostname === baseObj.hostname;
		} catch {
			return false;
		}
	}

	/**
	 * Get domain from URL
	 */
	static getDomain(url: string): string {
		try {
			const urlObj = new URL(url);
			return `${urlObj.protocol}//${urlObj.hostname}`;
		} catch {
			return "";
		}
	}

	/**
	 * Extract path segments for categorization
	 */
	static getPathSegments(url: string): string[] {
		try {
			const urlObj = new URL(url);
			return urlObj.pathname.split("/").filter((segment) => segment.length > 0);
		} catch {
			return [];
		}
	}
}
