import { useState } from 'react';

const SOURCES = [
  {
    category: 'Geographic Data',
    items: [
      {
        name: 'kusaasira/uganda-geo-data',
        url: 'https://github.com/kusaasira/uganda-geo-data',
        desc: 'Districts, counties, sub-counties, parishes & 71,000+ villages scraped from Uganda\'s passport portal. MIT licence.',
        tag: 'Primary dataset',
        tagColor: '#FCDC04',
        tagTextColor: '#1A0A02',
      },
      {
        name: 'bahiirwa/uganda-APIs',
        url: 'https://github.com/bahiirwa/uganda-APIs',
        desc: 'District region labels (North / South / East / West / Central) and area sizes in sq km.',
        tag: 'Supplementary',
        tagColor: 'rgba(232,132,26,0.25)',
        tagTextColor: '#F0A040',
      },
    ],
  },
  {
    category: 'Official Sources',
    items: [
      {
        name: 'Uganda Passport Application System',
        url: 'https://passports.go.ug',
        desc: 'Directorate of Citizenship & Immigration Control — original source from which geographic data was scraped.',
        tag: 'Government',
        tagColor: 'rgba(0,122,61,0.25)',
        tagTextColor: '#4AC87A',
      },
      {
        name: 'Uganda Electoral Commission',
        url: 'https://www.ec.or.ug',
        desc: 'Electoral statistics: 60,800 villages, 8,386 parishes, 1,671 sub-counties, 122 districts.',
        tag: 'Government',
        tagColor: 'rgba(0,122,61,0.25)',
        tagTextColor: '#4AC87A',
      },
      {
        name: 'ISO 3166-2:UG — Wikipedia',
        url: 'https://en.wikipedia.org/wiki/ISO_3166-2:UG',
        desc: 'ISO district codes (UG-101 through UG-432) used for district identification.',
        tag: 'Reference',
        tagColor: 'rgba(10,92,120,0.25)',
        tagTextColor: '#60B8D8',
      },
    ],
  },
  {
    category: 'npm Package',
    items: [
      {
        name: 'uganda (npmx.dev)',
        url: 'https://npmx.dev/package/uganda',
        desc: 'The original npm package that inspired this project. Published by javaScriptKampala.',
        tag: 'Inspiration',
        tagColor: 'rgba(139,58,26,0.25)',
        tagTextColor: '#E08055',
      },
    ],
  },
];

export default function Credits() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <footer style={{ borderTop: '1px solid rgba(252,220,4,0.08)' }}>
      {/* Credits trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '18px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px',
          color: hovered ? 'rgba(252,220,4,0.6)' : 'rgba(240,234,214,0.28)',
          transition: 'color 0.15s',
        }}
      >
        {/* Chevron */}
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '11px', fontWeight: 600 }}>
          Credits &amp; Sources
        </span>
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Expandable panel */}
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? '2000px' : '0',
        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{
          padding: '8px 16px 40px',
          maxWidth: '720px',
          margin: '0 auto',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '22px',
              fontWeight: 800,
              color: '#F0EAD6',
              margin: '0 0 8px',
            }}>
              Credits &amp; Sources
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(240,234,214,0.40)', margin: 0 }}>
              This platform is built on the work of open-data contributors and Ugandan government portals.
            </p>
          </div>

          {/* Source categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '36px' }}>
            {SOURCES.map((group) => (
              <div key={group.category}>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'rgba(252,220,4,0.45)',
                  margin: '0 0 10px',
                }}>
                  {group.category}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.items.map((item) => (
                    <SourceCard key={item.name} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(252,220,4,0.08)', marginBottom: '28px' }} />

          {/* Built by */}
          <div>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'rgba(252,220,4,0.45)',
              margin: '0 0 10px',
            }}>
              Built by
            </p>

            <div style={{
              background: 'rgba(252,220,4,0.04)',
              border: '1px solid rgba(252,220,4,0.12)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}>
              {/* Top accent bar — Uganda flag */}
              <div style={{ display: 'flex', height: '3px' }}>
                {['#1a1a1a','#FCDC04','#C8101A','#1a1a1a','#FCDC04','#C8101A'].map((c, i) => (
                  <div key={i} style={{ flex: 1, background: c }} />
                ))}
              </div>

              <div style={{ padding: '20px 20px 18px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                {/* Avatar — real GitHub profile photo */}
                <a href="https://github.com/mwanjeronie" target="_blank" rel="noopener noreferrer"
                  style={{ flexShrink: 0, display: 'block', borderRadius: '50%', overflow: 'hidden',
                    width: '64px', height: '64px', border: '2px solid rgba(252,220,4,0.30)',
                    boxShadow: '0 0 0 3px rgba(252,220,4,0.08)' }}>
                  <img
                    src="https://github.com/mwanjeronie.png"
                    alt="Mwanje Ronnie"
                    width={64} height={64}
                    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </a>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name + location */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{
                      fontFamily: "'Syne', sans-serif", fontWeight: 800,
                      fontSize: '19px', color: '#F0EAD6', lineHeight: 1,
                    }}>
                      Mwanje Ronnie
                    </span>
                    <span style={{
                      fontSize: '11px', color: 'rgba(240,234,214,0.40)',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      Kampala, Uganda
                    </span>
                  </div>

                  {/* Bio */}
                  <p style={{
                    fontSize: '12px', color: 'rgba(240,234,214,0.45)',
                    margin: '0 0 14px', lineHeight: 1.6,
                  }}>
                    Vibecoded this whole thing because I was too scared to knock on my neighbour's door and ask where I am. 🏘️ Now 84,000 locations later — still haven't knocked.
                  </p>

                  {/* Social links */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <SocialLink href="https://github.com/mwanjeronie" label="mwanjeronie" icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
                      </svg>
                    } />
                    <SocialLink href="https://www.linkedin.com/in/mwanjeronnie/" label="mwanjeronnie" icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
                      </svg>
                    } />
                    <SocialLink href="https://x.com/mwanje_ronnie1" label="@mwanje_ronnie1" icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    } />
                  </div>
                </div>

                <span style={{ fontSize: '22px', flexShrink: 0, alignSelf: 'flex-start', marginTop: '2px', opacity: 0.8 }}>🇺🇬</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '5px 11px', borderRadius: '999px', textDecoration: 'none',
        fontSize: '11px', fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
        background: hovered ? 'rgba(252,220,4,0.12)' : 'rgba(252,220,4,0.05)',
        border: `1px solid ${hovered ? 'rgba(252,220,4,0.35)' : 'rgba(252,220,4,0.12)'}`,
        color: hovered ? '#FCDC04' : 'rgba(240,234,214,0.55)',
        transition: 'all 0.15s',
      }}
    >
      {icon}
      {label}
    </a>
  );
}

type SourceItem = (typeof SOURCES)[number]['items'][number];

function SourceCard({ item }: { item: SourceItem }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        textDecoration: 'none',
        background: hovered ? 'rgba(252,220,4,0.07)' : 'rgba(252,220,4,0.03)',
        border: `1px solid ${hovered ? 'rgba(252,220,4,0.22)' : 'rgba(252,220,4,0.08)'}`,
        borderRadius: '14px',
        padding: '14px 16px',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: '14px',
          color: hovered ? '#FCDC04' : '#F0EAD6',
          transition: 'color 0.15s',
        }}>
          {item.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{
            fontSize: '10px', fontWeight: 600,
            padding: '2px 8px', borderRadius: '999px',
            background: item.tagColor, color: item.tagTextColor,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {item.tag}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={hovered ? '#FCDC04' : 'rgba(240,234,214,0.25)'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.15s' }}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </div>
      </div>
      <p style={{ fontSize: '12px', color: 'rgba(240,234,214,0.45)', margin: 0, lineHeight: 1.6 }}>
        {item.desc}
      </p>
      <p style={{ fontSize: '11px', color: 'rgba(252,220,4,0.35)', margin: '6px 0 0', fontFamily: 'monospace' }}>
        {item.url}
      </p>
    </a>
  );
}
