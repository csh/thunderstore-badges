# thunderstore-badges

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/csh/thunderstore-badges/tree/main/)


Simple Cloudflare Worker function for rendering shields.io style badges for Thunderstore packages.

Quick implementation in response to [this](https://discord.com/channels/809128887366975518/809128887366975521/1400442969311416371).

## Examples:

#### Latest Version

![Version](https://thunderstore-badges.smrkn.workers.dev/smrkn/LethalCompanyHighlights/version)

```
![Version](https://<your domain>/<namespace>/<packageName>/version)
```

#### Download Count

![Downloads](https://thunderstore-badges.smrkn.workers.dev/smrkn/LethalCompanyHighlights/downloads)


```
![Downloads](https://<your domain>/<namespace>/<packageName>/downloads)
```

