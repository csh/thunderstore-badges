interface ThunderstoreApiResponse {
	downloads: number;
	rating_score: number;
	latest_version: string;
}

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const [_, namespace, packageName, type] = url.pathname.split('/');

		if (!namespace || !packageName || !['version', 'downloads'].includes(type)) {
			const svg = makeBadge('400', 'Bad request', '#cc3011');
			return new Response(svg, {
				status: 400,
				statusText: 'Missing /version or /downloads',
				headers: {
					'Content-Type': 'image/svg+xml',
				},
			});
		}

		const apiUrl = `https://thunderstore.io/api/v1/package-metrics/${namespace}/${packageName}/`;
		const res = await fetch(apiUrl, {
			cf: {
				cacheTtlByStatus: {
					'200': 600,
					'404': 300
				},
				cacheEverything: true,
			}
		});

		if (!res.ok) {
			const svg = makeBadge('404', 'Package not found', '#cc3011');
			return new Response(svg, {
				status: 404,
				statusText: 'Package not found',
				headers: {
					'Content-Type': 'image/svg+xml',
					'Cache-Control': 'public, max-age=300',
					'ETag': `"${type}-${namespace}-${packageName}"`
				},
			});
		}

		const data = await res.json<ThunderstoreApiResponse>();

		const label = type;
		const message = type === 'version' ? data.latest_version ?? 'unknown' : formatNumber(data.downloads ?? 0);

		const svg = makeBadge(label, message);
		return new Response(svg, {
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=600',
				'ETag': `"${type}-${namespace}-${packageName}"`
			},
		});
	},
};

function formatNumber(num: number): string {
	if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
	if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k';
	return String(num);
}

function makeBadge(label: string, message: string, colour: string = '#44cc11'): string {
	const charWidth = 7;
	const labelTextWidth = label.length * charWidth;
	const messageTextWidth = message.length * charWidth;
	const labelBoxWidth = labelTextWidth + 10;
	const messageBoxWidth = messageTextWidth + 10;
	const totalWidth = labelBoxWidth + messageBoxWidth;

	const labelTextX = Math.floor((labelBoxWidth * 10) / 2);
	const messageTextX = Math.floor((labelBoxWidth + messageBoxWidth / 2) * 10);

	return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${message}">
  <title>${label}: ${message}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbbbbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelBoxWidth}" height="20" fill="#555555"/>
    <rect x="${labelBoxWidth}" width="${messageBoxWidth}" height="20" fill="${colour}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#ffffff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${labelTextX}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${
		labelTextWidth * 10
	}">${label}</text>
    <text x="${labelTextX}" y="140" transform="scale(.1)" fill="#fff" textLength="${labelTextWidth * 10}">${label}</text>
    <text aria-hidden="true" x="${messageTextX}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${
		messageTextWidth * 10
	}">${message}</text>
    <text x="${messageTextX}" y="140" transform="scale(.1)" fill="#fff" textLength="${messageTextWidth * 10}">${message}</text>
  </g>
</svg>`.trim();
}
