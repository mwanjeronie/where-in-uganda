# Where in Uganda? 🇺🇬

> Search any village, parish, sub-county, county or district in Uganda — get its full administrative hierarchy instantly.

**Live site → [uganda.winjo.xyz](https://uganda.winjo.xyz)**

![Where in Uganda? — Location search app](public/og-image.png)

---

## What it does

**Where in Uganda?** is a fast, fully client-side location search engine for Uganda's administrative geography. Type any place name and instantly see its full hierarchy — from village all the way up to district and region.

- **84,000+ locations** indexed: villages, parishes, sub-counties, counties, and districts
- **Instant search** — no server, no API calls, works offline after first load
- **Full hierarchy** — every result shows its complete administrative breadcrumb
- **Detail view** — drill into any location to see its children and metadata
- **Use my location** *(beta)* — GPS + reverse geocoding to find nearby places

---

## Data coverage

| Level | Count |
|---|---|
| Districts | 146 |
| Counties | 290 |
| Sub-counties | 1,382 |
| Parishes | 10,365 |
| Villages | 71,250 |
| **Total** | **84,173** |

---

## Tech stack

- **React 19** + **TypeScript** — UI
- **Vite 8** — build tooling
- **Tailwind CSS v4** — styling
- **Pre-built search index** — 84k entries flattened to a single `search-index.json`, fetched once and cached
- **Nominatim (OpenStreetMap)** — reverse geocoding for "Use my location"

---

## Running locally

```bash
git clone https://github.com/mwanjeronie/where-in-uganda.git
cd where-in-uganda
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Data sources

- [kusaasira/uganda-geo-data](https://github.com/kusaasira/uganda-geo-data) — village / parish / sub-county / county / district data
- [bahiirwa/uganda-APIs](https://github.com/bahiirwa/uganda-APIs) — district region & size metadata
- [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) — reverse geocoding
- [UBOS — Uganda Bureau of Statistics](https://www.ubos.org/) — official administrative reference

---

## Built by

**Mwanje Ronnie** — Kampala, Uganda

[![GitHub](https://img.shields.io/badge/GitHub-mwanjeronie-181717?logo=github)](https://github.com/mwanjeronie)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-mwanjeronnie-0A66C2?logo=linkedin)](https://www.linkedin.com/in/mwanjeronnie/)
[![X](https://img.shields.io/badge/X-mwanje__ronnie1-000000?logo=x)](https://x.com/mwanje_ronnie1)

---

## License

MIT
