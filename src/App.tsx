import { useState, useMemo, useEffect, useRef } from 'react';
import SearchBar from './components/SearchBar';
import FilterPills from './components/FilterPills';
import ResultCard from './components/ResultCard';
import DetailView from './components/DetailView';
import Credits from './components/Credits';
import { useGeolocation } from './hooks/useGeolocation';
import { search, loadIndex, getIndex, type LocationEntry, type LocationType } from './utils/search';
import { assignGroupedSlugs, assignSubCountySlugs, districtTitle, parishTitle, slugify, subCountyTitle, type AssignedSubCountySlug } from './utils/placeSlugs.ts';

type FilterOption = LocationType | 'all';
type View =
  | { kind: 'search' }
  | { kind: 'districts' }
  | { kind: 'detail'; entry: LocationEntry; history: LocationEntry[] };
type Route =
  | { kind: 'search' }
  | { kind: 'districts' }
  | { kind: 'district'; slug: string }
  | { kind: 'subcounty'; districtSlug: string; subSlug: string }
  | { kind: 'parish'; districtSlug: string; subSlug: string; parishSlug: string };
type HistoryState = { district?: string; subcounty?: string; parish?: string } | null;

const HOME_TITLE = 'Where in Uganda? — Find Your Village, Parish & Sub-county for Documents';

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

function readRoute(pathname: string): Route {
  const path = normalizePath(pathname);
  if (path === '/districts') return { kind: 'districts' };
  const match = path.match(/^\/district\/([a-z0-9-]+)(?:\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?)?$/);
  if (!match) return { kind: 'search' };
  if (match[3]) return { kind: 'parish', districtSlug: match[1], subSlug: match[2], parishSlug: match[3] };
  if (match[2]) return { kind: 'subcounty', districtSlug: match[1], subSlug: match[2] };
  return { kind: 'district', slug: match[1] };
}

function subCountyRecords(index: LocationEntry[]) {
  return index
    .filter((entry) => entry.type === 'sub_county')
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      countyName: entry.breadcrumb[1] ?? '',
      districtName: entry.breadcrumb[0] || entry.districtName,
    }));
}

let subCountySlugCache: { index: LocationEntry[]; slugs: Map<string, AssignedSubCountySlug> } | null = null;
let parishSlugCache: {
  index: LocationEntry[];
  slugs: Map<string, string>;
  parents: Map<string, AssignedSubCountySlug>;
} | null = null;

function subCountySlugs(index: LocationEntry[]) {
  if (subCountySlugCache?.index === index) return subCountySlugCache.slugs;
  const slugs = assignSubCountySlugs(subCountyRecords(index));
  subCountySlugCache = { index, slugs };
  return slugs;
}

function findDistrict(index: LocationEntry[], slug: string): LocationEntry | undefined {
  return index.find((entry) => entry.type === 'district' && slugify(entry.name) === slug);
}

function findSubCounty(index: LocationEntry[], districtSlug: string, subSlug: string): LocationEntry | undefined {
  const slugs = subCountySlugs(index);
  return index.find((entry) => {
    if (entry.type !== 'sub_county') return false;
    const assigned = slugs.get(entry.id);
    return assigned?.districtSlug === districtSlug && assigned.subSlug === subSlug;
  });
}

function parentKey(districtName: string, countyName: string, subCountyName: string): string {
  return `${districtName}\0${countyName}\0${subCountyName}`;
}

function parishSlugIndex(index: LocationEntry[]) {
  if (parishSlugCache?.index === index) return parishSlugCache;
  const subSlugs = subCountySlugs(index);
  const parents = new Map<string, AssignedSubCountySlug>();
  for (const entry of index) {
    if (entry.type !== 'sub_county') continue;
    const assigned = subSlugs.get(entry.id);
    if (!assigned) continue;
    parents.set(parentKey(entry.breadcrumb[0] || entry.districtName, entry.breadcrumb[1] ?? '', entry.name), assigned);
  }
  const records = [];
  for (const entry of index) {
    if (entry.type !== 'parish') continue;
    const parent = parents.get(parentKey(entry.breadcrumb[0] || entry.districtName, entry.breadcrumb[1] ?? '', entry.breadcrumb[2] ?? ''));
    records.push({
      id: entry.id,
      name: entry.name,
      group: parent ? `${parent.districtSlug}/${parent.subSlug}` : `missing/${entry.id}`,
    });
  }
  parishSlugCache = { index, slugs: assignGroupedSlugs(records, 'parish'), parents };
  return parishSlugCache;
}

function parishParent(entry: LocationEntry, index: LocationEntry[]): AssignedSubCountySlug | undefined {
  return parishSlugIndex(index).parents.get(
    parentKey(entry.breadcrumb[0] || entry.districtName, entry.breadcrumb[1] ?? '', entry.breadcrumb[2] ?? ''),
  );
}

function findParish(index: LocationEntry[], districtSlug: string, subSlug: string, parishSlug: string): LocationEntry | undefined {
  const slugs = parishSlugIndex(index).slugs;
  return index.find((entry) => {
    if (entry.type !== 'parish' || slugs.get(entry.id) !== parishSlug) return false;
    const parent = parishParent(entry, index);
    return parent?.districtSlug === districtSlug && parent.subSlug === subSlug;
  });
}

function pathForEntry(entry: LocationEntry, index: LocationEntry[]): string | null {
  if (entry.type === 'district') return `/district/${slugify(entry.name)}`;
  if (entry.type === 'sub_county') {
    const assigned = subCountySlugs(index).get(entry.id);
    return assigned ? `/district/${assigned.districtSlug}/${assigned.subSlug}` : null;
  }
  if (entry.type !== 'parish') return null;
  const parent = parishParent(entry, index);
  const parishSlug = parishSlugIndex(index).slugs.get(entry.id);
  return parent && parishSlug ? `/district/${parent.districtSlug}/${parent.subSlug}/${parishSlug}` : null;
}

function historyStateFor(url: string): HistoryState {
  const route = readRoute(url);
  if (route.kind === 'district') return { district: route.slug };
  if (route.kind === 'subcounty') return { district: route.districtSlug, subcounty: route.subSlug };
  if (route.kind === 'parish') return { district: route.districtSlug, subcounty: route.subSlug, parish: route.parishSlug };
  return null;
}

function pushedStateMatches(pathname: string): boolean {
  const route = readRoute(pathname);
  const state = window.history.state as HistoryState;
  if (!state) return false;
  if (route.kind === 'district') return state.district === route.slug && !state.subcounty && !state.parish;
  if (route.kind === 'subcounty') return state.district === route.districtSlug && state.subcounty === route.subSlug && !state.parish;
  if (route.kind === 'parish') {
    return state.district === route.districtSlug && state.subcounty === route.subSlug && state.parish === route.parishSlug;
  }
  return false;
}

function syncDocumentTitle(index: LocationEntry[] | null) {
  const route = readRoute(window.location.pathname);
  if (route.kind === 'districts') {
    document.title = 'Districts in Uganda | Where in Uganda?';
    return;
  }
  if (route.kind === 'district') {
    const entry = index ? findDistrict(index, route.slug) : undefined;
    if (entry) document.title = districtTitle(entry.name);
    return;
  }
  if (route.kind === 'subcounty') {
    const entry = index ? findSubCounty(index, route.districtSlug, route.subSlug) : undefined;
    if (entry) document.title = subCountyTitle(entry.name, entry.breadcrumb[1] ?? '', entry.districtName);
    return;
  }
  if (route.kind === 'parish') {
    const entry = index ? findParish(index, route.districtSlug, route.subSlug, route.parishSlug) : undefined;
    if (entry) document.title = parishTitle(entry.name, entry.breadcrumb[2] ?? '', entry.districtName);
    return;
  }
  document.title = HOME_TITLE;
}

function viewForPath(index: LocationEntry[] | null): View {
  const route = readRoute(window.location.pathname);
  if (route.kind === 'districts') return { kind: 'districts' };
  if (!index) return { kind: 'search' };
  if (route.kind === 'district') {
    const entry = findDistrict(index, route.slug);
    return entry ? { kind: 'detail', entry, history: [] } : { kind: 'search' };
  }
  if (route.kind === 'subcounty') {
    const entry = findSubCounty(index, route.districtSlug, route.subSlug);
    return entry ? { kind: 'detail', entry, history: [] } : { kind: 'search' };
  }
  if (route.kind === 'parish') {
    const entry = findParish(index, route.districtSlug, route.subSlug, route.parishSlug);
    return entry ? { kind: 'detail', entry, history: [] } : { kind: 'search' };
  }
  return { kind: 'search' };
}

export default function App() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [view, setView] = useState<View>(() =>
    readRoute(window.location.pathname).kind === 'districts' ? { kind: 'districts' } : { kind: 'search' }
  );
  const [indexLoaded, setIndexLoaded] = useState(false);
  const [indexError, setIndexError] = useState('');
  const [directory, setDirectory] = useState<LocationEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { geoState, geoResult, geoError, locate, clearGeo, supported } = useGeolocation();

  useEffect(() => {
    loadIndex()
      .then((index) => {
        setIndexLoaded(true);
        setDirectory(
          index
            .filter((entry) => entry.type === 'district')
            .sort((a, b) => a.name.localeCompare(b.name, 'en')),
        );
        setView(viewForPath(index));
        syncDocumentTitle(index);
      })
      .catch((e) => setIndexError(String(e)));
  }, []);

  useEffect(() => {
    function onPopState() {
      const index = getIndex();
      setView(viewForPath(index));
      syncDocumentTitle(index);
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(query), 200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const results = useMemo(
    () => (indexLoaded ? search(debouncedQuery, filter) : []),
    [debouncedQuery, filter, indexLoaded]
  );

  const totalIndexed = useMemo(() => getIndex()?.length ?? 0, [indexLoaded]);

  function openDetail(entry: LocationEntry) {
    setView((prev) => {
      if (prev.kind === 'detail') {
        return { kind: 'detail', entry, history: [...prev.history, prev.entry] };
      }
      return { kind: 'detail', entry, history: [] };
    });
    const index = getIndex();
    if (index && (entry.type === 'district' || entry.type === 'sub_county' || entry.type === 'parish')) {
      const url = pathForEntry(entry, index);
      if (url && normalizePath(window.location.pathname) !== url) {
        window.history.pushState(historyStateFor(url), '', url);
      }
      document.title = entry.type === 'district'
        ? districtTitle(entry.name)
        : entry.type === 'sub_county'
          ? subCountyTitle(entry.name, entry.breadcrumb[1] ?? '', entry.districtName)
          : parishTitle(entry.name, entry.breadcrumb[2] ?? '', entry.districtName);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    if (view.kind !== 'detail') return;
    const index = getIndex();

    if (view.history.length > 0) {
      const parent = view.history[view.history.length - 1];
      const parentUrl = index ? pathForEntry(parent, index) : null;
      const current = normalizePath(window.location.pathname);
      if (parentUrl && parentUrl !== current && pushedStateMatches(window.location.pathname)) {
        window.history.back();
        return;
      }
      if (parentUrl && parentUrl !== current) {
        window.history.replaceState(historyStateFor(parentUrl), '', parentUrl);
      } else if (!parentUrl && pushedStateMatches(window.location.pathname) && index) {
        const ancestor = [...view.history].reverse().find((entry) => pathForEntry(entry, index));
        const ancestorUrl = ancestor ? pathForEntry(ancestor, index) : null;
        if (ancestorUrl && ancestorUrl !== current) {
          window.history.replaceState(historyStateFor(ancestorUrl), '', ancestorUrl);
        }
      }
      setView({ kind: 'detail', entry: parent, history: view.history.slice(0, -1) });
      syncDocumentTitle(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (pushedStateMatches(window.location.pathname)) {
      window.history.back();
      return;
    }
    if (readRoute(window.location.pathname).kind !== 'search') {
      window.history.replaceState(null, '', '/');
    }
    setView({ kind: 'search' });
    syncDocumentTitle(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const route = readRoute(window.location.pathname);
  const waitingForPlace = (route.kind === 'district' || route.kind === 'subcounty' || route.kind === 'parish') && !indexLoaded && !indexError && view.kind !== 'detail';
  const showSearch = view.kind === 'search' && !waitingForPlace;
  const showNearYou = geoState === 'done' && geoResult && !debouncedQuery.trim();

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Uganda flag strip */}
      <div style={{ display: 'flex', height: '5px', width: '100%' }}>
        {['#1a1a1a', '#FCDC04', '#C8101A', '#1a1a1a', '#FCDC04', '#C8101A'].map((c, i) => (
          <div key={i} style={{ flex: 1, background: c }} />
        ))}
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 16px' }}>
        {/* Header */}
        {showSearch && (
          <div style={{ textAlign: 'center', paddingTop: '52px', marginBottom: '40px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: '999px', marginBottom: '20px',
              background: 'rgba(252,220,4,0.08)', border: '1px solid rgba(252,220,4,0.18)',
              fontSize: '13px', color: 'rgba(252,220,4,0.75)',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              <span>🇺🇬</span>
              <span>Filling a form? Find your village instantly</span>
            </div>

            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(40px, 8vw, 64px)',
              fontWeight: 800, lineHeight: 1, letterSpacing: '-2px',
              color: '#F0EAD6', margin: '0 0 16px',
            }}>
              Where in{' '}
              <span style={{
                background: 'linear-gradient(130deg, #FCDC04 0%, #E8841A 40%, #C8101A 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Uganda?
              </span>
            </h1>

            <p style={{ color: 'rgba(240,234,214,0.45)', fontSize: '15px', maxWidth: '440px', margin: '0 auto', lineHeight: 1.6 }}>
              Find your village, parish, sub-county and district — perfect for NIN registration, NIRA, KCCA forms and any official document.
            </p>
          </div>
        )}

        {/* Detail view */}
        {view.kind === 'detail' && (
          <div style={{ paddingTop: '32px' }}>
            <DetailView entry={view.entry} onBack={goBack} onSelect={openDetail} />
          </div>
        )}

        {view.kind === 'districts' && (
          <div style={{ paddingTop: '32px', paddingBottom: '72px' }}>
            <a href="/" style={{ color: '#FCDC04', fontSize: '14px', textDecoration: 'none' }}>← Where in Uganda?</a>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(32px, 6vw, 48px)',
              lineHeight: 1.1,
              margin: '16px 0',
              color: '#F0EAD6',
            }}>
              Districts in Uganda
            </h1>
            {!indexLoaded && !indexError && (
              <p style={{ color: 'rgba(240,234,214,0.45)' }}>Loading districts…</p>
            )}
            {indexLoaded && (
              <>
                <p style={{ color: 'rgba(240,234,214,0.55)', marginTop: 0 }}>
                  {directory.length.toLocaleString()} districts. Open one for its counties and sub-counties.
                </p>
                <ul style={{ columns: 2, paddingLeft: '1.2em', margin: 0 }}>
                  {directory.map((entry) => (
                    <li key={entry.id} style={{ margin: '4px 0' }}>
                      <a href={`/district/${slugify(entry.name)}`} style={{ color: '#FCDC04', textDecoration: 'none' }}>
                        {entry.name} District
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {waitingForPlace && (
          <p style={{ paddingTop: '48px', textAlign: 'center', color: 'rgba(240,234,214,0.45)' }}>
            Loading place…
          </p>
        )}

        {indexError && !showSearch && (
          <div style={{
            margin: '24px 0', padding: '16px', borderRadius: '12px',
            background: 'rgba(200,16,26,0.12)', border: '1px solid rgba(200,16,26,0.25)',
            color: '#E87070', fontSize: '14px',
          }}>
            Failed to load location data: {indexError}
          </div>
        )}

        {/* Search view */}
        {showSearch && (
          <div style={{ paddingBottom: '96px' }}>
            {/* Loading */}
            {!indexLoaded && !indexError && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  width: '100%', borderRadius: '16px', padding: '20px 24px',
                  background: 'rgba(252,220,4,0.04)', border: '1px solid rgba(252,220,4,0.10)',
                  color: 'rgba(240,234,214,0.35)', fontSize: '16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <span style={{
                    display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%',
                    border: '2px solid rgba(252,220,4,0.25)', borderTopColor: '#FCDC04',
                    animation: 'spin 0.8s linear infinite', flexShrink: 0,
                  }} />
                  Loading 84,000+ Uganda locations…
                </div>
              </div>
            )}

            {indexError && (
              <div style={{
                marginBottom: '24px', padding: '16px', borderRadius: '12px',
                background: 'rgba(200,16,26,0.12)', border: '1px solid rgba(200,16,26,0.25)',
                color: '#E87070', fontSize: '14px',
              }}>
                Failed to load location data: {indexError}
              </div>
            )}

            {indexLoaded && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <SearchBar
                    value={query}
                    onChange={(v) => { setQuery(v); if (v) clearGeo(); }}
                    resultCount={results.length}
                    totalIndexed={totalIndexed}
                    geoState={geoState}
                    onLocate={locate}
                    supported={supported}
                  />
                </div>
                <div style={{ marginBottom: '28px' }}>
                  <FilterPills active={filter} onChange={setFilter} />
                </div>
              </>
            )}

            {/* Geolocation error */}
            {geoState === 'error' && geoError && (
              <div style={{
                marginBottom: '20px', padding: '12px 16px', borderRadius: '12px',
                background: 'rgba(200,16,26,0.10)', border: '1px solid rgba(200,16,26,0.22)',
                color: '#E87070', fontSize: '13px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
              }}>
                <span>{geoError}</span>
                <button onClick={clearGeo} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                  color: 'rgba(232,112,112,0.6)', flexShrink: 0,
                }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Near You section */}
            {showNearYou && geoResult && (
              <div style={{ marginBottom: '32px' }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '14px', gap: '12px',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '16px' }}>📍</span>
                      <span style={{
                        fontFamily: "'Syne', sans-serif", fontWeight: 700,
                        fontSize: '15px', color: '#F0EAD6',
                      }}>
                        Near you
                      </span>
                    </div>
                    <p style={{
                      fontSize: '12px', color: 'rgba(240,234,214,0.38)',
                      margin: 0, paddingLeft: '24px',
                      maxWidth: '480px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {geoResult.displayName}
                    </p>
                  </div>
                  <button
                    onClick={clearGeo}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      color: 'rgba(240,234,214,0.28)', flexShrink: 0, display: 'flex', alignItems: 'center',
                    }}
                    title="Dismiss"
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(240,234,214,0.60)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,234,214,0.28)')}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {geoResult.matches.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {geoResult.matches.map((entry) => (
                      <ResultCard key={entry.id} entry={entry} query={geoResult.resolvedLabel} onClick={openDetail} />
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '20px', borderRadius: '14px', textAlign: 'center',
                    background: 'rgba(252,220,4,0.03)', border: '1px solid rgba(252,220,4,0.08)',
                    color: 'rgba(240,234,214,0.35)', fontSize: '13px', lineHeight: 1.6,
                  }}>
                    Found your coordinates but couldn't match "{geoResult.resolvedLabel}" to our index.<br />
                    <span style={{ color: 'rgba(240,234,214,0.22)', fontSize: '12px' }}>
                      Try searching manually — OSM coverage may be limited in your area.
                    </span>
                  </div>
                )}

                {/* Coverage note */}
                <p style={{ fontSize: '11px', color: 'rgba(240,234,214,0.22)', marginTop: '10px', paddingLeft: '2px' }}>
                  Powered by OpenStreetMap · Rural coverage may be limited
                </p>

                {/* Divider before main search */}
                <div style={{ borderTop: '1px solid rgba(252,220,4,0.08)', marginTop: '24px' }} />
              </div>
            )}

            {/* Idle prompt — only shown when no geo result and no query */}
            {indexLoaded && !debouncedQuery.trim() && !showNearYou && geoState !== 'error' && (
              <div style={{ marginTop: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>🗺️</div>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 600, color: 'rgba(240,234,214,0.40)', marginBottom: '8px' }}>
                  Type your village or area name
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(240,234,214,0.22)' }}>
                  {totalIndexed.toLocaleString()} villages, parishes & districts · or tap <em>Use my location</em>
                </p>
              </div>
            )}

            {/* Empty state */}
            {indexLoaded && debouncedQuery.trim() && results.length === 0 && (
              <div style={{ marginTop: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '44px', marginBottom: '16px' }}>🔍</div>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 600, color: 'rgba(240,234,214,0.50)', marginBottom: '8px' }}>
                  No results for "{debouncedQuery}"
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(240,234,214,0.25)' }}>
                  Try a different spelling or broaden your search
                </p>
              </div>
            )}

            {/* Search results */}
            {results.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {results.map((entry) => (
                  <ResultCard key={entry.id} entry={entry} query={debouncedQuery} onClick={openDetail} />
                ))}
                {results.length >= 60 && (
                  <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(240,234,214,0.22)', paddingTop: '16px' }}>
                    Showing top 60 — refine your search for more specific results
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Credits />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
