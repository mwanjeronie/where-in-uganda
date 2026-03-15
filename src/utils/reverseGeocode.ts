import { search, type LocationEntry } from './search';

interface NominatimAddress {
  village?: string;
  hamlet?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country_code?: string;
}

interface NominatimResponse {
  display_name: string;
  address: NominatimAddress;
}

export interface ReverseGeocodeResult {
  displayName: string;
  resolvedLabel: string;
  matches: LocationEntry[];
}

const CANDIDATE_FIELDS: (keyof NominatimAddress)[] = [
  'village',
  'hamlet',
  'neighbourhood',
  'suburb',
  'town',
  'city',
  'municipality',
  'county',
  'state',
];

export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'where-in-uganda-app/1.0 (https://github.com/mwanjeronie)',
      'Accept-Language': 'en',
    },
  });

  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);

  const data = (await res.json()) as NominatimResponse;

  if (data.address?.country_code && data.address.country_code !== 'ug') {
    throw new Error('outside_uganda');
  }

  const addr = data.address ?? {};

  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const field of CANDIDATE_FIELDS) {
    const val = addr[field];
    if (val && !seen.has(val.toLowerCase())) {
      seen.add(val.toLowerCase());
      candidates.push(val);
    }
  }

  if (candidates.length === 0) throw new Error('outside_uganda');

  const seenIds = new Set<string>();
  const matches: LocationEntry[] = [];

  for (const candidate of candidates) {
    const results = search(candidate, 'all', 20);
    for (const entry of results) {
      if (!seenIds.has(entry.id)) {
        seenIds.add(entry.id);
        matches.push(entry);
      }
    }
  }

  const typeOrder: Record<string, number> = {
    village: 0, parish: 1, sub_county: 2, county: 3, district: 4,
  };
  matches.sort((a, b) => (typeOrder[a.type] ?? 5) - (typeOrder[b.type] ?? 5));

  const resolvedLabel = candidates[0] ?? addr.state ?? 'your location';

  return {
    displayName: data.display_name ?? resolvedLabel,
    resolvedLabel,
    matches: matches.slice(0, 12),
  };
}
