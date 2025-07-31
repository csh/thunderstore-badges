import { makeBadge } from 'badge-maker';

interface ThunderstoreApiResponse {
	downloads: number;
	rating_score: number;
	latest_version: string;
}

const allowedStyles = ['plastic', 'flat', 'flat-square', 'for-the-badge', 'social'] as const;
type Style = typeof allowedStyles[number];

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const [_, namespace, packageName, type] = url.pathname.split('/');

		const queryStyle = url.searchParams.get('style');
		const style = allowedStyles.includes(queryStyle as Style) ? (queryStyle as Style) : 'flat';

		if (!namespace || !packageName || !['version', 'downloads'].includes(type)) {
			const svg = makeBadge({
				label: '400',
				message: 'Bad Request',
				color: 'red',
				style: style,
			});

			return new Response(svg, {
				status: 400,
				statusText: 'Missing /version or /downloads',
				headers: {
					'Content-Type': 'image/svg+xml',
				},
			});
		}

		const apiUrl = `https://thunderstore.io/api/v1/package-metrics/${namespace}/${packageName}/`;
		const cache = caches.default;

		let res = await cache.match(apiUrl);
		if (!res) {
			console.log('Cache miss', {
				namespace: namespace,
				package: packageName,
			});

			res = await fetch(apiUrl, {
				cf: {
					cacheTtlByStatus: {
						'200': 600,
						'404': 300,
					},
					cacheEverything: true,
				},
			});
			ctx.waitUntil(cache.put(apiUrl, res.clone()));
		}

		if (!res.ok) {
			const svg = makeBadge({
				label: '404',
				message: 'Package not found.',
				color: 'red',
				style: style,
			});

			return new Response(svg, {
				status: 404,
				statusText: 'Package not found',
				headers: {
					'Content-Type': 'image/svg+xml',
					'Cache-Control': 'public, max-age=300',
					ETag: `"${type}-${namespace}-${packageName}"`,
				},
			});
		}

		const data = await res.json<ThunderstoreApiResponse>();
		const label = type;
		const message = type === 'version' ? data.latest_version ?? 'unknown' : formatNumber(data.downloads ?? 0);

		const svg = makeBadge({
			label: label,
			message: message,
			color: 'brightgreen',
			style: style,
		});

		return new Response(svg, {
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=600',
				ETag: `"${type}-${namespace}-${packageName}"`,
			},
		});
	},
};

function formatNumber(num: number): string {
	if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
	if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k';
	return String(num);
}
