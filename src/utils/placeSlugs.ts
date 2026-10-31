export type SubCountySlugRecord = {
  id: string;
  name: string;
  countyName: string;
  districtName: string;
};

export type AssignedSubCountySlug = {
  districtSlug: string;
  subSlug: string;
};

/** Lowercase hyphenated slug. Shared by the app and scripts/prerender.mjs. */
export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function districtTitle(name: string): string {
  return `${name} District, Uganda: counties, sub-counties and parishes | Where in Uganda?`;
}

export function subCountyTitle(name: string, countyName: string, districtName: string): string {
  return `${name} Sub-county, ${countyName}, ${districtName} District: parishes and villages | Where in Uganda?`;
}

export function parishTitle(name: string, subCountyName: string, districtName: string): string {
  return `${name} Parish, ${subCountyName}, ${districtName} District: villages | Where in Uganda?`;
}

export type GroupedSlugRecord = {
  id: string;
  name: string;
  group: string;
};

/**
 * Slugs are unique inside each group. The first name keeps the plain slug;
 * a repeated name gets -2, -3, and so on. Id sort ignores a prefix such as "p-".
 */
export function assignGroupedSlugs(records: GroupedSlugRecord[], fallback: string): Map<string, string> {
  const byGroup = new Map<string, GroupedSlugRecord[]>();
  for (const record of records) {
    const list = byGroup.get(record.group);
    if (list) list.push(record);
    else byGroup.set(record.group, [record]);
  }

  const assigned = new Map<string, string>();
  for (const list of byGroup.values()) {
    const used = new Set<string>();
    const sorted = list.slice().sort((a, b) =>
      a.name.localeCompare(b.name, 'en')
      || idSortKey(a.id).localeCompare(idSortKey(b.id), 'en'),
    );
    for (const record of sorted) {
      const base = slugify(record.name) || fallback;
      let slug = base;
      if (used.has(slug)) {
        let n = 2;
        while (used.has(`${base}-${n}`)) n += 1;
        slug = `${base}-${n}`;
      }
      used.add(slug);
      assigned.set(String(record.id), slug);
    }
  }
  return assigned;
}

function idSortKey(id: string): string {
  const match = String(id).match(/(\d+)$/);
  return match ? match[1].padStart(8, '0') : String(id);
}

/**
 * Slugs are unique within a district. A repeated name keeps the county in the slug.
 * Sort keys ignore an id prefix such as "sc-" so the app index and the source data agree.
 */
export function assignSubCountySlugs(records: SubCountySlugRecord[]): Map<string, AssignedSubCountySlug> {
  const byDistrict = new Map<string, SubCountySlugRecord[]>();
  for (const record of records) {
    const districtSlug = slugify(record.districtName);
    const list = byDistrict.get(districtSlug);
    if (list) list.push(record);
    else byDistrict.set(districtSlug, [record]);
  }

  const assigned = new Map<string, AssignedSubCountySlug>();
  for (const [districtSlug, list] of byDistrict) {
    const baseCounts = new Map<string, number>();
    for (const record of list) {
      const base = slugify(record.name) || 'sub-county';
      baseCounts.set(base, (baseCounts.get(base) ?? 0) + 1);
    }

    const used = new Set<string>();
    const sorted = list.slice().sort((a, b) =>
      a.name.localeCompare(b.name, 'en')
      || a.countyName.localeCompare(b.countyName, 'en')
      || idSortKey(a.id).localeCompare(idSortKey(b.id), 'en'),
    );

    for (const record of sorted) {
      const base = slugify(record.name) || 'sub-county';
      let subSlug = (baseCounts.get(base) ?? 0) > 1
        ? `${base}-${slugify(record.countyName) || 'county'}`
        : base;
      if (used.has(subSlug)) {
        let n = 2;
        while (used.has(`${subSlug}-${n}`)) n += 1;
        subSlug = `${subSlug}-${n}`;
      }
      used.add(subSlug);
      assigned.set(String(record.id), { districtSlug, subSlug });
    }
  }

  return assigned;
}
