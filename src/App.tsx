import { useState, useMemo, useEffect, useRef } from 'react';
import SearchBar from './components/SearchBar';
import FilterPills from './components/FilterPills';
import ResultCard from './components/ResultCard';
import DetailView from './components/DetailView';
import Credits from './components/Credits';
import { useGeolocation } from './hooks/useGeolocation';
import { search, loadIndex, getIndex, type LocationEntry, type LocationType } from './utils/search';

type FilterOption = LocationType | 'all';
type View = { kind: 'search' } | { kind: 'detail'; entry: LocationEntry; history: LocationEntry[] };

export default function App() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [view, setView] = useState<View>({ kind: 'search' });
  const [indexLoaded, setIndexLoaded] = useState(false);
  const [indexError, setIndexError] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { geoState, geoResult, geoError, locate, clearGeo, supported } = useGeolocation();

  useEffect(() => {
    loadIndex()
      .then(() => setIndexLoaded(true))
      .catch((e) => setIndexError(String(e)));
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setView((prev) => {
      if (prev.kind !== 'detail') return prev;
      if (prev.history.length > 0) {
        const history = [...prev.history];
        const entry = history.pop()!;
        return { kind: 'detail', entry, history };
      }
      return { kind: 'search' };
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const isDetail = view.kind === 'detail';
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
        {!isDetail && (
          <div style={{ textAlign: 'center', paddingTop: '52px', marginBottom: '40px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: '999px', marginBottom: '20px',
              background: 'rgba(252,220,4,0.08)', border: '1px solid rgba(252,220,4,0.18)',
              fontSize: '13px', color: 'rgba(252,220,4,0.75)',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              <span>🇺🇬</span>
              <span>84,000+ locations across Uganda</span>
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

            <p style={{ color: 'rgba(240,234,214,0.45)', fontSize: '15px', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
              Search any village, parish, sub-county, county or district — get its full location hierarchy instantly.
            </p>
          </div>
        )}

        {/* Detail view */}
        {isDetail && view.kind === 'detail' && (
          <div style={{ paddingTop: '32px' }}>
            <DetailView entry={view.entry} onBack={goBack} onSelect={openDetail} />
          </div>
        )}

        {/* Search view */}
        {!isDetail && (
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
                  Start typing to explore Uganda
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(240,234,214,0.22)' }}>
                  {totalIndexed.toLocaleString()} locations · or tap <em>Use my location</em>
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
