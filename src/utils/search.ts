export type LocationType = 'district' | 'county' | 'sub_county' | 'parish' | 'village';

// Compact format stored in search-index.json
// t: 'd'=district, 'c'=county, 'sc'=sub_county, 'p'=parish, 'v'=village
interface RawEntry {
  id: string;
  n: string;       // name
  t: string;       // type code
  b: string[];     // breadcrumb (full path including self as last item)
  r: string;       // region
  s: string;       // district size (sq km)
  di?: string;     // district name (for non-district entries)
}

export interface LocationEntry {
  id: string;
  name: string;
  type: LocationType;
  breadcrumb: string[];   // path excluding self
  region: string;
  districtSize: string;
  districtName: string;
}

const TYPE_MAP: Record<string, LocationType> = {
  d: 'district',
  c: 'county',
  sc: 'sub_county',
  p: 'parish',
  v: 'village',
};

export const TYPE_LABELS: Record<LocationType, string> = {
  district: 'District',
  county: 'County',
  sub_county: 'Sub-county',
  parish: 'Parish',
  village: 'Village',
};

type FilterOption = LocationType | 'all';

let _index: LocationEntry[] | null = null;
let _loading: Promise<LocationEntry[]> | null = null;

export function getIndex(): LocationEntry[] | null {
  return _index;
}

export async function loadIndex(): Promise<LocationEntry[]> {
  if (_index) return _index;
  if (_loading) return _loading;

  _loading = fetch('/search-index.json')
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load search index: ${r.status}`);
      return r.json() as Promise<RawEntry[]>;
    })
    .then((raw) => {
      _index = raw.map((e) => ({
        id: e.id,
        name: e.n,
        type: TYPE_MAP[e.t] ?? 'village',
        breadcrumb: e.b.slice(0, -1),  // exclude self; self = name
        region: e.r,
        districtSize: e.s,
        districtName: e.t === 'd' ? e.n : (e.di ?? e.b[0] ?? ''),
      }));
      return _index;
    });

  return _loading;
}

export function search(
  query: string,
  filterType: FilterOption,
  limit = 60
): LocationEntry[] {
  if (!_index || !query.trim()) return [];
  const q = query.toLowerCase().trim();

  const exact: LocationEntry[] = [];
  const startsWith: LocationEntry[] = [];
  const includes: LocationEntry[] = [];

  for (const entry of _index) {
    if (filterType !== 'all' && entry.type !== filterType) continue;
    const name = entry.name.toLowerCase();
    if (name === q) exact.push(entry);
    else if (name.startsWith(q)) startsWith.push(entry);
    else if (name.includes(q)) includes.push(entry);

    if (exact.length + startsWith.length + includes.length >= limit * 3) break;
  }

  return [...exact, ...startsWith, ...includes].slice(0, limit);
}

// Look up full entry details by id
export function getById(id: string): LocationEntry | undefined {
  return _index?.find((e) => e.id === id);
}

// Get all children of a given entry for the detail view
export function getChildren(entry: LocationEntry): LocationEntry[] {
  if (!_index) return [];

  const childType: Record<LocationType, LocationType | null> = {
    district: 'county',
    county: 'sub_county',
    sub_county: 'parish',
    parish: 'village',
    village: null,
  };

  const ct = childType[entry.type];
  if (!ct) return [];

  // Children share the same breadcrumb prefix
  const prefix = [...entry.breadcrumb, entry.name];

  return _index.filter((e) => {
    if (e.type !== ct) return false;
    if (e.breadcrumb.length < prefix.length) return false;
    return prefix.every((p, i) => e.breadcrumb[i] === p);
  });
}
