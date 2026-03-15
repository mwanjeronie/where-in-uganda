import type { GeoState } from '../hooks/useGeolocation';

interface Props {
  value: string;
  onChange: (v: string) => void;
  resultCount: number;
  totalIndexed: number;
  geoState: GeoState;
  onLocate: () => void;
  supported: boolean;
}

const GEO_LABEL: Record<GeoState, string> = {
  idle:       'Use my location',
  requesting: 'Requesting GPS…',
  locating:   'Looking up location…',
  done:       'Use my location',
  error:      'Use my location',
};

export default function SearchBar({ value, onChange, resultCount, totalIndexed, geoState, onLocate, supported }: Props) {
  const busy = geoState === 'requesting' || geoState === 'locating';

  return (
    <div>
      <div style={{ position: 'relative' }}>
        {/* Search icon */}
        <div style={{
          position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: '#FCDC04', opacity: 0.7,
          display: 'flex', alignItems: 'center',
        }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search village, parish, sub-county, district…"
          autoFocus
          style={{
            width: '100%',
            background: 'rgba(252,220,4,0.05)',
            border: '1.5px solid rgba(252,220,4,0.15)',
            borderRadius: '16px',
            padding: '18px 48px 18px 52px',
            fontSize: '16px',
            color: '#F0EAD6',
            fontFamily: "'DM Sans', sans-serif",
            outline: 'none',
            transition: 'border-color 0.15s, background 0.15s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(252,220,4,0.5)';
            e.currentTarget.style.background = 'rgba(252,220,4,0.08)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(252,220,4,0.15)';
            e.currentTarget.style.background = 'rgba(252,220,4,0.05)';
          }}
        />

        {/* Clear button */}
        {value && (
          <button
            onClick={() => onChange('')}
            style={{
              position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
              color: 'rgba(240,234,214,0.35)', display: 'flex', alignItems: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(240,234,214,0.7)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,234,214,0.35)')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Below-input row: result count + locate button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', gap: '12px' }}>
        <p style={{ fontSize: '13px', color: 'rgba(240,234,214,0.35)', margin: 0, paddingLeft: '4px', flexShrink: 0 }}>
          {value.trim()
            ? resultCount === 0
              ? 'No results found'
              : `${resultCount} result${resultCount !== 1 ? 's' : ''} from ${totalIndexed.toLocaleString()} locations`
            : <span style={{ color: 'rgba(240,234,214,0.20)' }}>{totalIndexed.toLocaleString()} locations ready</span>
          }
        </p>

        {supported && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
            <button
              onClick={onLocate}
              disabled={busy}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif", cursor: busy ? 'default' : 'pointer',
                border: '1.5px solid rgba(252,220,4,0.22)',
                background: busy ? 'rgba(252,220,4,0.06)' : 'rgba(252,220,4,0.08)',
                color: busy ? 'rgba(252,220,4,0.45)' : 'rgba(252,220,4,0.80)',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = 'rgba(252,220,4,0.16)'; }}
              onMouseLeave={(e) => { if (!busy) e.currentTarget.style.background = 'rgba(252,220,4,0.08)'; }}
            >
              {busy ? (
                <span style={{
                  display: 'inline-block', width: '11px', height: '11px', borderRadius: '50%',
                  border: '1.5px solid rgba(252,220,4,0.25)', borderTopColor: '#FCDC04',
                  animation: 'spin 0.7s linear infinite', flexShrink: 0,
                }} />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  <path d="M12 2a10 10 0 0 1 10 10" opacity="0.4" />
                </svg>
              )}
              {GEO_LABEL[geoState]}
            </button>
            <span style={{
              fontSize: '10px', fontFamily: "'DM Sans', sans-serif",
              color: 'rgba(240,234,214,0.25)', letterSpacing: '0.04em',
            }}>
              ⚠ beta · accuracy may vary
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
