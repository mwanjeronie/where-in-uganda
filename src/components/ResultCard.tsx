import { useState } from 'react';
import type { LocationEntry, LocationType } from '../utils/search';
import { TYPE_LABELS } from '../utils/search';

// Uganda-palette colors for each admin level
const TYPE_STYLE: Record<LocationType, { bg: string; text: string; dot: string; hoverBorder: string }> = {
  district:   { bg: 'rgba(200,16,26,0.18)',  text: '#E86060', dot: '#C8101A', hoverBorder: 'rgba(200,16,26,0.45)' },
  county:     { bg: 'rgba(232,132,26,0.18)', text: '#F0A040', dot: '#E8841A', hoverBorder: 'rgba(232,132,26,0.45)' },
  sub_county: { bg: 'rgba(0,122,61,0.20)',   text: '#4AC87A', dot: '#007A3D', hoverBorder: 'rgba(0,122,61,0.45)'  },
  parish:     { bg: 'rgba(139,58,26,0.22)',  text: '#E08055', dot: '#8B3A1A', hoverBorder: 'rgba(139,58,26,0.45)' },
  village:    { bg: 'rgba(10,92,120,0.22)',  text: '#60B8D8', dot: '#0A5C78', hoverBorder: 'rgba(10,92,120,0.45)' },
};

const REGION_ICONS: Record<string, string> = {
  North: '↑', South: '↓', East: '→', West: '←', Central: '◆',
};

interface Props {
  entry: LocationEntry;
  query: string;
  onClick: (entry: LocationEntry) => void;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#FCDC04', color: '#1A0A02', borderRadius: '3px', padding: '0 2px', fontStyle: 'normal' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function ResultCard({ entry, query, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const s = TYPE_STYLE[entry.type];

  return (
    <button
      onClick={() => onClick(entry)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        background: hovered ? 'rgba(252,220,4,0.07)' : 'rgba(252,220,4,0.04)',
        border: `1.5px solid ${hovered ? s.hoverBorder : 'rgba(252,220,4,0.08)'}`,
        borderRadius: '16px',
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        display: 'block',
      }}
    >
      {/* Name row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: '15px',
          color: hovered ? '#F0EAD6' : '#E8E0C8',
          lineHeight: 1.3,
          transition: 'color 0.15s',
        }}>
          {highlight(entry.name, query)}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Type badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
            background: s.bg, color: s.text,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
            {TYPE_LABELS[entry.type]}
          </span>
          {/* Arrow */}
          <span style={{ color: hovered ? 'rgba(252,220,4,0.6)' : 'rgba(240,234,214,0.20)', fontSize: '14px', transition: 'color 0.15s' }}>→</span>
        </div>
      </div>

      {/* Breadcrumb */}
      {entry.breadcrumb.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
          {entry.breadcrumb.map((crumb, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {i > 0 && <span style={{ color: 'rgba(240,234,214,0.18)', fontSize: '12px' }}>›</span>}
              <span style={{ fontSize: '12px', color: 'rgba(240,234,214,0.40)' }}>{crumb}</span>
            </span>
          ))}
        </div>
      )}

      {/* Region / size */}
      {(entry.region || entry.districtSize) && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {entry.region && (
            <span style={{ fontSize: '11px', color: 'rgba(240,234,214,0.28)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ opacity: 0.6 }}>{REGION_ICONS[entry.region] ?? '•'}</span>
              {entry.region} Region
            </span>
          )}
          {entry.districtSize && (
            <span style={{ fontSize: '11px', color: 'rgba(240,234,214,0.28)' }}>
              {Number(entry.districtSize).toLocaleString()} km²
            </span>
          )}
        </div>
      )}
    </button>
  );
}
