export type LocationType = 'district' | 'county' | 'sub_county' | 'parish' | 'village';

// Packed search-index.json:
// s: string table
// i: [nameIndex, typeCode, numericId, breadcrumbIndexes, regionIndex?, size?]
// Region and district size are stored only on district rows. Breadcrumbs omit the place itself.
type PackedItem = [number, string, number, number[], number?, string?];
interface PackedIndex {
  s: string[];
  i: PackedItem[];
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
      return r.json() as Promise<PackedIndex>;
    })
    .then((packed) => {
      const strings = packed.s;
      const preliminary = packed.i.map((row) => {
        const name = strings[row[0]] ?? '';
        const typeCode = row[1];
        const type = TYPE_MAP[typeCode] ?? 'village';
        const breadcrumb = row[3].map((index) => strings[index] ?? '');
        return {
          id: `${typeCode}-${row[2]}`,
          name,
          type,
          breadcrumb,
          region: row[4] !== undefined ? (strings[row[4]] ?? '') : '',
          districtSize: row[5] ?? '',
        };
      });
      const districts = new Map<string, { region: string; size: string }>();
      for (const entry of preliminary) {
        if (entry.type === 'district') {
          districts.set(entry.name, { region: entry.region, size: entry.districtSize });
        }
      }
      _index = preliminary.map((entry) => {
        const parent = entry.type === 'district' ? undefined : districts.get(entry.breadcrumb[0] ?? '');
        return {
          id: entry.id,
          name: entry.name,
          type: entry.type,
          breadcrumb: entry.breadcrumb,
          region: entry.type === 'district' ? entry.region : (parent?.region ?? ''),
          districtSize: entry.type === 'district' ? entry.districtSize : (parent?.size ?? ''),
          districtName: entry.type === 'district' ? entry.name : (entry.breadcrumb[0] ?? ''),
        };
      });
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
