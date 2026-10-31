import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ORIGIN = 'https://uganda.winjo.xyz';
const root = join(import.meta.dirname, '..');
const dist = join(root, 'dist');
const templatePath = join(dist, 'index.html');

/** Keep in sync with districtSlug() in src/App.tsx */
function districtSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function countPhrase(count, singular, plural) {
  const label = count === 1 ? singular : plural;
  return `${count.toLocaleString('en-US')} ${label}`;
}

function districtTitle(name) {
  return `${name} District, Uganda: counties, sub-counties and parishes | Where in Uganda?`;
}

function districtDescription(district) {
  return `${district.name} District, Uganda has ${countPhrase(district.counties.length, 'county', 'counties')}, ${countPhrase(district.subCounties.length, 'sub-county', 'sub-counties')}, ${countPhrase(district.parishCount, 'parish', 'parishes')} and ${countPhrase(district.villageCount, 'village', 'villages')}.`;
}

function replaceOnce(html, pattern, value, label) {
  let done = false;
  const next = html.replace(pattern, () => {
    done = true;
    return value;
  });
  if (!done) throw new Error(`Could not update ${label} in dist/index.html`);
  return next;
}

function jsonScript(data) {
  const json = JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">\n${json}\n    </script>`;
}

function breadcrumbList(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function applyHead(html, { title, description, url, jsonLd }) {
  let next = html;
  next = replaceOnce(next, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`, 'title');
  next = replaceOnce(
    next,
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    'description',
  );
  next = replaceOnce(
    next,
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    'canonical',
  );
  next = replaceOnce(
    next,
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    'og:url',
  );
  next = replaceOnce(
    next,
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    'og:title',
  );
  next = replaceOnce(
    next,
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    'og:description',
  );
  next = replaceOnce(
    next,
    /<meta name="twitter:url" content="[^"]*" \/>/,
    `<meta name="twitter:url" content="${escapeHtml(url)}" />`,
    'twitter:url',
  );
  next = replaceOnce(
    next,
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    'twitter:title',
  );
  next = replaceOnce(
    next,
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    'twitter:description',
  );

  const withoutLd = next.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  if (withoutLd === next || withoutLd.includes('FAQPage') || withoutLd.includes('WebApplication')) {
    throw new Error('Could not remove the homepage JSON-LD from the district template');
  }
  next = withoutLd;

  const structured = jsonLd.map((entry) => `    ${jsonScript(entry)}`).join('\n');
  const style = `    <style>
      .district-static { max-width: 720px; margin: 0 auto; padding: 32px 16px 72px; font-family: "DM Sans", sans-serif; line-height: 1.55; }
      .district-static h1 { font-family: Syne, sans-serif; font-size: clamp(32px, 6vw, 48px); line-height: 1.1; margin: 12px 0 16px; }
      .district-static h2 { font-family: Syne, sans-serif; font-size: 22px; margin: 28px 0 8px; }
      .district-static a { color: #FCDC04; }
      .district-static li { margin: 4px 0; }
      .district-index { columns: 2; padding-left: 1.2em; }
      @media (max-width: 600px) { .district-index { columns: 1; } }
    </style>`;
  next = replaceOnce(next, /<\/head>/, `${structured}\n${style}\n  </head>`, 'head close');
  return next;
}

function replaceRoot(html, inner) {
  const open = '<div id="root">';
  const start = html.indexOf(open);
  if (start < 0) throw new Error('dist/index.html is missing #root');
  const innerStart = start + open.length;
  const end = html.indexOf('</div>', innerStart);
  if (end < 0) throw new Error('dist/index.html is missing the #root close');
  return `${html.slice(0, innerStart)}\n${inner}\n    ${html.slice(end)}`;
}

function list(items) {
  if (items.length === 0) return '        <p>None are listed for this district.</p>';
  return `        <ul>\n${items.map((item) => `          <li>${item}</li>`).join('\n')}\n        </ul>`;
}

function districtBody(district) {
  const countyItems = district.counties.map((county) => escapeHtml(county.name));
  const subItems = district.subCounties.map(
    (sub) => `${escapeHtml(sub.name)} (${escapeHtml(sub.countyName)})`,
  );
  return `      <main class="district-static">
        <p><a href="/">Where in Uganda?</a> · <a href="/districts">Districts</a></p>
        <h1>${escapeHtml(district.name)} District, Uganda</h1>
        <p>${escapeHtml(districtDescription(district))}</p>
        <h2>Counties</h2>
${list(countyItems)}
        <h2>Sub-counties</h2>
${list(subItems)}
      </main>`;
}

function indexBody(districts) {
  const items = districts
    .map(
      (district) =>
        `          <li><a href="/district/${district.slug}">${escapeHtml(district.name)} District</a></li>`,
    )
    .join('\n');
  return `      <main class="district-static">
        <p><a href="/">Where in Uganda?</a></p>
        <h1>Districts in Uganda</h1>
        <p>This directory lists ${districts.length.toLocaleString('en-US')} districts. Open a district to see its counties and sub-counties.</p>
        <ul class="district-index">
${items}
        </ul>
      </main>`;
}

function finishPage(html, expectedH1) {
  if (!/<script type="module"/.test(html)) {
    throw new Error(`App script missing from page ${expectedH1}`);
  }
  if (!html.includes(expectedH1)) throw new Error(`H1 missing from page ${expectedH1}`);
  return html;
}

function writePage(relativePath, html) {
  const file = join(dist, relativePath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  return Buffer.byteLength(html);
}

function loadJson(name) {
  return JSON.parse(readFileSync(join(root, 'src/data', name), 'utf8'));
}

function groupBy(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const id = String(row[key]);
    const list = groups.get(id);
    if (list) list.push(row);
    else groups.set(id, [row]);
  }
  return groups;
}

const template = readFileSync(templatePath, 'utf8');
if (!/<script type="module"/.test(template)) {
  throw new Error('dist/index.html is missing the app script. Run vite build first.');
}

const sourceDistricts = loadJson('districts.json');
const sourceCounties = loadJson('counties.json');
const sourceSubs = loadJson('sub_counties.json');
const sourceParishes = loadJson('parishes.json');
const sourceVillages = loadJson('villages.json');

const countiesByDistrict = groupBy(sourceCounties, 'district');
const subsByCounty = groupBy(sourceSubs, 'county');
const parishesBySub = groupBy(sourceParishes, 'subcounty');
const villageCountByParish = new Map();
for (const village of sourceVillages) {
  const id = String(village.parish);
  villageCountByParish.set(id, (villageCountByParish.get(id) ?? 0) + 1);
}

const seenSlugs = new Set();
const districts = sourceDistricts.map((district) => {
  const slug = districtSlug(district.name);
  if (!slug) throw new Error(`Empty slug for district ${district.name}`);
  if (seenSlugs.has(slug)) throw new Error(`Duplicate district slug: ${slug}`);
  seenSlugs.add(slug);

  const counties = (countiesByDistrict.get(String(district.id)) ?? [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
  const subCounties = [];
  let parishCount = 0;
  let villageCount = 0;
  for (const county of counties) {
    const subs = subsByCounty.get(String(county.id)) ?? [];
    for (const sub of subs) {
      subCounties.push({ name: sub.name, countyName: county.name });
      const parishes = parishesBySub.get(String(sub.id)) ?? [];
      parishCount += parishes.length;
      for (const parish of parishes) {
        villageCount += villageCountByParish.get(String(parish.id)) ?? 0;
      }
    }
  }
  subCounties.sort((a, b) => a.name.localeCompare(b.name, 'en') || a.countyName.localeCompare(b.countyName, 'en'));
  return { ...district, slug, counties, subCounties, parishCount, villageCount };
});

districts.sort((a, b) => a.name.localeCompare(b.name, 'en'));

let addedBytes = 0;
for (const district of districts) {
  const url = `${ORIGIN}/district/${district.slug}`;
  const title = districtTitle(district.name);
  const description = districtDescription(district);
  let html = applyHead(template, {
    title,
    description,
    url,
    jsonLd: [
      breadcrumbList([
        { name: 'Where in Uganda?', url: `${ORIGIN}/` },
        { name: 'Districts', url: `${ORIGIN}/districts` },
        { name: `${district.name} District`, url },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'AdministrativeArea',
        name: `${district.name} District`,
        url,
        containedInPlace: {
          '@type': 'Country',
          name: 'Uganda',
        },
      },
    ],
  });
  html = replaceRoot(html, districtBody(district));
  html = finishPage(html, `<h1>${escapeHtml(district.name)} District, Uganda</h1>`);
  addedBytes += writePage(join('district', district.slug, 'index.html'), html);
}

const indexTitle = 'Districts in Uganda | Where in Uganda?';
const indexDescription = `All ${districts.length.toLocaleString('en-US')} districts, with a page for each district's counties and sub-counties.`;
let indexHtml = applyHead(template, {
  title: indexTitle,
  description: indexDescription,
  url: `${ORIGIN}/districts`,
  jsonLd: [
    breadcrumbList([
      { name: 'Where in Uganda?', url: `${ORIGIN}/` },
      { name: 'Districts', url: `${ORIGIN}/districts` },
    ]),
  ],
});
indexHtml = replaceRoot(indexHtml, indexBody(districts));
indexHtml = finishPage(indexHtml, '<h1>Districts in Uganda</h1>');
addedBytes += writePage(join('districts', 'index.html'), indexHtml);

const sitemapPath = join(dist, 'sitemap.xml');
const previousSitemap = statSync(sitemapPath, { throwIfNoEntry: false })?.size ?? 0;
const urls = [
  `${ORIGIN}/`,
  `${ORIGIN}/districts`,
  ...districts.map((district) => `${ORIGIN}/district/${district.slug}`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url>\n    <loc>${loc}</loc>\n  </url>`).join('\n')}
</urlset>
`;
writeFileSync(sitemapPath, sitemap);
addedBytes += Buffer.byteLength(sitemap) - previousSitemap;

const summary = {
  districtPages: districts.length,
  indexPages: 1,
  sitemapUrls: urls.length,
  addedBytes,
};
for (const name of ['Wakiso', 'Kampala', 'Abim']) {
  const district = districts.find((item) => item.name === name);
  summary[name] = {
    slug: district.slug,
    counties: district.counties.length,
    subCounties: district.subCounties.length,
    parishes: district.parishCount,
    villages: district.villageCount,
  };
}
console.log(JSON.stringify(summary, null, 2));
