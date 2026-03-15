import { useState } from 'react';
import type { LocationEntry, LocationType } from '../utils/search';
import { TYPE_LABELS, getChildren } from '../utils/search';

const TYPE_STYLE: Record<LocationType, {
  bg: string; text: string; dot: string;
  border: string; cardBg: string; childHover: string;
}> = {
  district:   { bg: 'rgba(200,16,26,0.18)',  text: '#E86060', dot: '#C8101A', border: 'rgba(200,16,26,0.35)',  cardBg: 'rgba(200,16,26,0.06)',  childHover: 'rgba(200,16,26,0.12)'  },
  county:     { bg: 'rgba(232,132,26,0.18)', text: '#F0A040', dot: '#E8841A', border: 'rgba(232,132,26,0.35)', cardBg: 'rgba(232,132,26,0.06)', childHover: 'rgba(232,132,26,0.12)' },
  sub_county: { bg: 'rgba(0,122,61,0.20)',   text: '#4AC87A', dot: '#007A3D', border: 'rgba(0,122,61,0.35)',   cardBg: 'rgba(0,122,61,0.06)',   childHover: 'rgba(0,122,61,0.12)'   },
  parish:     { bg: 'rgba(139,58,26,0.22)',  text: '#E08055', dot: '#8B3A1A', border: 'rgba(139,58,26,0.35)',  cardBg: 'rgba(139,58,26,0.06)',  childHover: 'rgba(139,58,26,0.12)'  },
  village:    { bg: 'rgba(10,92,120,0.22)',  text: '#60B8D8', dot: '#0A5C78', border: 'rgba(10,92,120,0.35)',  cardBg: 'rgba(10,92,120,0.06)',  childHover: 'rgba(10,92,120,0.12)'  },
};

const CHILD_LABEL: Record<LocationType, string> = {
  district: 'Counties', county: 'Sub-counties', sub_county: 'Parishes', parish: 'Villages', village: '',
};

const REGION_ICONS: Record<string, string> = {
  North: '↑', South: '↓', East: '→', West: '←', Central: '◆',
};

function ChildButton({ child, onSelect }: { child: LocationEntry; onSelect: (e: LocationEntry) => void }) {
  const [hovered, setHovered] = useState(false);
  const cs = TYPE_STYLE[child.type];
  return (
    <button
      onClick={() => onSelect(child)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textAlign: 'left',
        background: hovered ? cs.childHover : 'rgba(252,220,4,0.03)',
        border: `1px solid ${hovered ? cs.border : 'rgba(252,220,4,0.08)'}`,
        borderRadius: '12px',
        padding: '10px 14px',
        cursor: 'pointer',
        transition: 'background 0.13s, border-color 0.13s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <span style={{ fontSize: '13px', fontWeight: 500, color: hovered ? '#F0EAD6' : 'rgba(240,234,214,0.75)', transition: 'color 0.13s' }}>
        {child.name}
      </span>
      <span style={{ fontSize: '12px', color: hovered ? 'rgba(252,220,4,0.7)' : 'rgba(240,234,214,0.25)', flexShrink: 0 }}>→</span>
    </button>
  );
}

interface Props {
  entry: LocationEntry;
  onBack: () => void;
  onSelect: (entry: LocationEntry) => void;
}

export default function DetailView({ entry, onBack, onSelect }: Props) {
  const [backHovered, setBackHovered] = useState(false);
  const s = TYPE_STYLE[entry.type];
  const children = getChildren(entry);
  const childLabel = CHILD_LABEL[entry.type];
  const fullPath = [...entry.breadcrumb, entry.name];

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        onMouseEnter={() => setBackHovered(true)}
        onMouseLeave={() => setBackHovered(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0',
          marginBottom: '28px', fontFamily: "'DM Sans', sans-serif",
          color: backHovered ? 'rgba(252,220,4,0.8)' : 'rgba(240,234,214,0.40)',
          fontSize: '14px', transition: 'color 0.15s',
        }}
      >
        <span style={{ fontSize: '16px', transform: backHovered ? 'translateX(-2px)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>←</span>
        Back to search
      </button>

      {/* Header card */}
      <div style={{
        borderRadius: '20px',
        border: `1.5px solid ${s.border}`,
        background: s.cardBg,
        padding: '24px',
        marginBottom: '20px',
      }}>
        {/* Title + badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(22px, 5vw, 32px)',
            color: '#F0EAD6', margin: 0, lineHeight: 1.15,
          }}>
            {entry.name}
          </h2>
          <span style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
            background: s.bg, color: s.text, fontFamily: "'DM Sans', sans-serif",
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot }} />
            {TYPE_LABELS[entry.type]}
          </span>
        </div>

        {/* Breadcrumb */}
        {entry.breadcrumb.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
            {entry.breadcrumb.map((crumb, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {i > 0 && <span style={{ color: 'rgba(240,234,214,0.22)', fontSize: '13px' }}>›</span>}
                <span style={{
                  fontSize: '12px', color: 'rgba(240,234,214,0.55)',
                  background: 'rgba(252,220,4,0.06)', border: '1px solid rgba(252,220,4,0.10)',
                  padding: '2px 10px', borderRadius: '999px',
                }}>
                  {crumb}
                </span>
              </span>
            ))}
            <span style={{ color: 'rgba(240,234,214,0.22)', fontSize: '13px' }}>›</span>
            <span style={{
              fontSize: '12px', fontWeight: 600,
              background: s.bg, color: s.text, border: `1px solid ${s.border}`,
              padding: '2px 10px', borderRadius: '999px',
            }}>
              {entry.name}
            </span>
          </div>
        )}

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
          {[
            entry.region && { label: 'Region', value: `${REGION_ICONS[entry.region] ?? '•'} ${entry.region}` },
            (entry.districtName && entry.type !== 'district') && { label: 'District', value: entry.districtName },
            entry.districtSize && { label: 'District Area', value: `${Number(entry.districtSize).toLocaleString()} km²` },
            { label: 'Admin Level', value: TYPE_LABELS[entry.type] },
            { label: 'Full Path', value: fullPath.join(' › '), small: true },
          ].filter(Boolean).map((item, i) => {
            const it = item as { label: string; value: string; small?: boolean };
            return (
              <div key={i} style={{
                background: 'rgba(252,220,4,0.04)', border: '1px solid rgba(252,220,4,0.08)',
                borderRadius: '12px', padding: '10px 12px',
              }}>
                <p style={{ fontSize: '11px', color: 'rgba(240,234,214,0.35)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {it.label}
                </p>
                <p style={{ fontSize: it.small ? '11px' : '14px', fontWeight: 600, color: '#F0EAD6', margin: 0, lineHeight: 1.4 }}>
                  {it.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Children */}
      {children.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'rgba(252,220,4,0.55)', margin: 0,
            }}>
              {childLabel}
            </h3>
            <span style={{ fontSize: '13px', color: 'rgba(240,234,214,0.30)' }}>
              {children.length.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {children.map((child) => (
              <ChildButton key={child.id} child={child} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}

      {entry.type === 'village' && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(240,234,214,0.22)' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📍</div>
          <p style={{ fontSize: '13px', margin: 0 }}>Village — lowest administrative level</p>
        </div>
      )}
    </div>
  );
}
