import type { LocationType } from '../utils/search';
import { TYPE_LABELS } from '../utils/search';

type FilterOption = LocationType | 'all';

const OPTIONS: FilterOption[] = ['all', 'district', 'county', 'sub_county', 'parish', 'village'];

const OPTION_LABELS: Record<FilterOption, string> = {
  all: 'All',
  ...TYPE_LABELS,
};

// Each type gets its Uganda-palette accent for the active state
const ACTIVE_COLORS: Record<FilterOption, { bg: string; text: string; border: string }> = {
  all:        { bg: '#FCDC04',          text: '#1A0A02',          border: '#FCDC04' },
  district:   { bg: '#C8101A',          text: '#FFE8E8',          border: '#C8101A' },
  county:     { bg: '#E8841A',          text: '#FFF3E0',          border: '#E8841A' },
  sub_county: { bg: '#007A3D',          text: '#E0FFE8',          border: '#007A3D' },
  parish:     { bg: '#8B3A1A',          text: '#FFE8D6',          border: '#8B3A1A' },
  village:    { bg: '#0A5C78',          text: '#E0F4FF',          border: '#0A5C78' },
};

interface Props {
  active: FilterOption;
  onChange: (v: FilterOption) => void;
}

export default function FilterPills({ active, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {OPTIONS.map((opt) => {
        const isActive = active === opt;
        const ac = ACTIVE_COLORS[opt];
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.15s',
              border: `1.5px solid ${isActive ? ac.border : 'rgba(252,220,4,0.12)'}`,
              background: isActive ? ac.bg : 'transparent',
              color: isActive ? ac.text : 'rgba(240,234,214,0.45)',
              boxShadow: isActive ? `0 2px 12px ${ac.bg}40` : 'none',
            }}
          >
            {OPTION_LABELS[opt]}
          </button>
        );
      })}
    </div>
  );
}
