import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { assignGroupedSlugs, assignSubCountySlugs, districtTitle, parishTitle, slugify, subCountyTitle } from '../src/utils/placeSlugs.ts';

const prerenderStarted = performance.now();

const ORIGIN = 'https://uganda.winjo.xyz';
const root = join(import.meta.dirname, '..');
const dist = join(root, 'dist');
const templatePath = join(dist, 'index.html');

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

function jsonLdBlock(items) {
  return items.map((entry) => `    ${jsonScript(entry)}`).join('\n');
}

function breadcrumbList(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const entry = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
      };
      if (item.url) entry.item = item.url;
      return entry;
    }),
  };
}

const TOKEN = {
  title: '\u0000TITLE\u0000',
  description: '\u0000DESCRIPTION\u0000',
  url: '\u0000URL\u0000',
  jsonld: '\u0000JSONLD\u0000',
  root: '\u0000ROOT\u0000',
};

function compileTemplate(template) {
  let html = template;
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${TOKEN.title}</title>`, 'title');
  html = replaceOnce(
    html,
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${TOKEN.description}" />`,
    'description',
  );
  html = replaceOnce(
    html,
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${TOKEN.url}" />`,
    'canonical',
  );
  html = replaceOnce(
    html,
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${TOKEN.url}" />`,
    'og:url',
  );
  html = replaceOnce(
    html,
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${TOKEN.title}" />`,
    'og:title',
  );
  html = replaceOnce(
    html,
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${TOKEN.description}" />`,
    'og:description',
  );
  html = replaceOnce(
    html,
    /<meta name="twitter:url" content="[^"]*" \/>/,
    `<meta name="twitter:url" content="${TOKEN.url}" />`,
    'twitter:url',
  );
  html = replaceOnce(
    html,
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${TOKEN.title}" />`,
    'twitter:title',
  );
  html = replaceOnce(
    html,
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${TOKEN.description}" />`,
    'twitter:description',
  );

  const withoutLd = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  if (withoutLd === html || withoutLd.includes('FAQPage') || withoutLd.includes('WebApplication')) {
    throw new Error('Could not remove the homepage JSON-LD from the district template');
  }
  html = withoutLd;
  html = replaceOnce(html, /<\/head>/, `${TOKEN.jsonld}\n  </head>`, 'head close');

  const open = '<div id="root">';
  const start = html.indexOf(open);
  if (start < 0) throw new Error('dist/index.html is missing #root');
  const innerStart = start + open.length;
  const end = html.indexOf('</div>', innerStart);
  if (end < 0) throw new Error('dist/index.html is missing the #root close');
  html = `${html.slice(0, innerStart)}\n${TOKEN.root}\n    ${html.slice(end)}`;
  if (!html.includes('<script type="module"')) {
    throw new Error('Compiled template is missing the app script');
  }
  return html;
}

function renderPage(shell, { title, description, url, jsonLd, body }) {
  return shell
    .replaceAll(TOKEN.title, title)
    .replaceAll(TOKEN.description, description)
    .replaceAll(TOKEN.url, url)
    .replaceAll(TOKEN.jsonld, jsonLd)
    .replaceAll(TOKEN.root, body);
}

function crumbs(items) {
  const parts = items.map((item, index) => {
    const sep = index === 0 ? '' : '<span aria-hidden="true">/</span>';
    const node = item.href
      ? `<a href="${item.href}">${escapeHtml(item.name)}</a>`
      : `<span${index === items.length - 1 ? ' aria-current="page"' : ''}>${escapeHtml(item.name)}</span>`;
    return `${sep}${node}`;
  }).join('');
  return `<nav class="crumbs" aria-label="Breadcrumb">${parts}</nav>`;
}

function copyForm(fields, hint) {
  const rows = fields.map((field) => `            <div><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(field.value || '—')}</dd></div>`).join('\n');
  return `        <section class="copy-form">
          <h2>Copy for your form</h2>
          <p class="hint">${escapeHtml(hint)}</p>
          <dl>
${rows}
          </dl>
          <button type="button" data-copy-form>Copy for your form</button>
        </section>`;
}

function cards(items) {
  if (items.length === 0) return '        <p class="empty">None are listed.</p>';
  return `        <ul class="cards">
${items.map((item) => `          <li><a href="${item.href}"><span class="card-title">${escapeHtml(item.title)}</span><span class="count">${escapeHtml(item.meta)}</span></a></li>`).join('\n')}
        </ul>`;
}

function chips(links) {
  if (links.length === 0) return '';
  return `<div class="chips">${links.map((link) => `<a href="${link.href}">${escapeHtml(link.name)}</a>`).join('')}</div>`;
}

function districtBody(district, neighbors) {
  const countyBlocks = district.counties.map((county) => {
    const subs = district.subCounties.filter((sub) => sub.countyName === county.name);
    return `        <section>
          <h2>${escapeHtml(county.name)}</h2>
          <p class="section-meta">${escapeHtml(countPhrase(subs.length, 'sub-county', 'sub-counties'))}</p>
${cards(subs.map((sub) => ({
    href: `/district/${district.slug}/${sub.slug}`,
    title: sub.name,
    meta: `${countPhrase(sub.parishes.length, 'parish', 'parishes')} · ${countPhrase(sub.villageCount, 'village', 'villages')}`,
  })))}
        </section>`;
  }).join('\n');
  const nearby = chips(neighbors.map((item) => ({
    href: `/district/${item.slug}`,
    name: `${item.name} District`,
  })));
  return `      <main id="content" class="place">
        ${crumbs([
          { name: 'Uganda', href: '/' },
          { name: 'Districts', href: '/districts' },
          { name: `${district.name} District` },
        ])}
        <h1>${escapeHtml(district.name)} District, Uganda</h1>
        <p class="lede">${escapeHtml(districtDescription(district))}</p>
        ${copyForm([
          { label: 'Village', value: '' },
          { label: 'Parish', value: '' },
          { label: 'Sub-county', value: '' },
          { label: 'County', value: '' },
          { label: 'District', value: district.name },
        ], `On a NIN, NIRA, or school form, this district is ${district.name}. Open a sub-county, then a parish, to fill in the village, parish, sub-county and county.`)}
${countyBlocks}
        ${nearby ? `<nav class="nearby" aria-label="Nearby districts"><h2>Nearby districts</h2>${nearby}</nav>` : ''}
      </main>`;
}

function subCountyDescription(sub, districtName) {
  return `${sub.name} Sub-county in ${sub.countyName}, ${districtName} District has ${countPhrase(sub.parishes.length, 'parish', 'parishes')} and ${countPhrase(sub.villageCount, 'village', 'villages')}.`;
}

function subCountyHeading(sub, districtName) {
  return `${sub.name} Sub-county, ${sub.countyName}, ${districtName} District`;
}

function subCountyBody(sub, district, siblings) {
  const parishCards = cards(sub.parishes.map((parish) => ({
    href: `/district/${district.slug}/${sub.slug}/${parish.slug}`,
    title: parish.name,
    meta: countPhrase(parish.villages.length, 'village', 'villages'),
  })));
  const nearby = chips(siblings.map((item) => ({
    href: `/district/${district.slug}/${item.slug}`,
    name: item.name,
  })));
  return `      <main id="content" class="place">
        ${crumbs([
          { name: 'Uganda', href: '/' },
          { name: `${district.name} District`, href: `/district/${district.slug}` },
          { name: sub.countyName },
          { name: sub.name },
        ])}
        <h1>${escapeHtml(subCountyHeading(sub, district.name))}</h1>
        <p class="lede">${escapeHtml(subCountyDescription(sub, district.name))}</p>
        ${copyForm([
          { label: 'Village', value: '' },
          { label: 'Parish', value: '' },
          { label: 'Sub-county', value: sub.name },
          { label: 'County', value: sub.countyName },
          { label: 'District', value: district.name },
        ], `On a NIN, NIRA, or school form, this is the ${sub.name} sub-county in ${sub.countyName}, ${district.name} district. Open a parish to choose the parish and village.`)}
        <h2>Parishes</h2>
${parishCards}
        ${nearby ? `<nav class="nearby" aria-label="Nearby sub-counties"><h2>Nearby in ${escapeHtml(sub.countyName)}</h2>${nearby}</nav>` : ''}
      </main>`;
}

function parishHeading(parish, sub, district) {
  return `${parish.name} Parish, ${sub.name}, ${district.name} District`;
}

function parishDescription(parish, sub, district) {
  return `${parish.name} Parish in ${sub.name}, ${district.name} District has ${countPhrase(parish.villages.length, 'village', 'villages')}.`;
}

function parishFormLine(parish, sub, district) {
  return `For a NIN or NIRA registration, or a school form, use a village name from this list, with ${parish.name} as the parish, ${sub.name} as the sub-county, ${sub.countyName} as the county, and ${district.name} as the district.`;
}

function parishBody(parish, sub, district, siblings) {
  const villages = parish.villages.length === 0
    ? 'No villages are listed for this parish.'
    : parish.villages.map((name) => escapeHtml(name)).join(', ');
  const nearby = chips(siblings.map((item) => ({
    href: `/district/${district.slug}/${sub.slug}/${item.slug}`,
    name: item.name,
  })));
  return `      <main id="content" class="place">
        ${crumbs([
          { name: 'Uganda', href: '/' },
          { name: `${district.name} District`, href: `/district/${district.slug}` },
          { name: sub.countyName },
          { name: sub.name, href: `/district/${district.slug}/${sub.slug}` },
          { name: parish.name },
        ])}
        <h1>${escapeHtml(parishHeading(parish, sub, district))}</h1>
        <p class="lede">${escapeHtml(parishDescription(parish, sub, district))}</p>
        ${copyForm([
          { label: 'Village', value: '' },
          { label: 'Parish', value: parish.name },
          { label: 'Sub-county', value: sub.name },
          { label: 'County', value: sub.countyName },
          { label: 'District', value: district.name },
        ], parishFormLine(parish, sub, district))}
        <h2>Villages</h2>
        <p class="villages">${villages}</p>
        ${nearby ? `<nav class="nearby" aria-label="Nearby parishes"><h2>Nearby parishes</h2>${nearby}</nav>` : ''}
      </main>`;
}

function indexBody(districts) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const groups = new Map();
  for (const district of districts) {
    const letter = district.name.slice(0, 1).toUpperCase();
    const list = groups.get(letter);
    if (list) list.push(district);
    else groups.set(letter, [district]);
  }
  const az = letters.map((letter) => (
    groups.has(letter)
      ? `<a href="#letter-${letter}">${letter}</a>`
      : `<span>${letter}</span>`
  )).join('');
  const sections = [...groups.entries()].map(([letter, list]) => `        <section id="letter-${letter}">
          <h2>${letter}</h2>
${cards(list.map((district) => ({
    href: `/district/${district.slug}`,
    title: `${district.name} District`,
    meta: `${countPhrase(district.counties.length, 'county', 'counties')} · ${countPhrase(district.subCounties.length, 'sub-county', 'sub-counties')}`,
  })))}
        </section>`).join('\n');
  return `      <main id="content" class="place">
        ${crumbs([{ name: 'Uganda', href: '/' }, { name: 'Districts' }])}
        <h1>Districts in Uganda</h1>
        <p class="lede">This directory lists ${districts.length.toLocaleString('en-US')} districts. Open a district to see its counties and sub-counties.</p>
        <nav class="az" aria-label="Jump to a letter">${az}</nav>
${sections}
      </main>`;
}

function finishPage(html, expectedH1) {
  if (!html.includes('rel="stylesheet" href="/place.css"')) {
    throw new Error(`Stylesheet missing from page ${expectedH1}`);
  }
  if (html.includes('<script type="module"')) {
    throw new Error(`Place page still loads the app bundle: ${expectedH1}`);
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
const headerSearch = `<form class="find" id="site-find" action="/" method="get" role="search">
        <label class="sr" for="site-search">Search places</label>
        <input id="site-search" name="q" type="search" placeholder="Village, parish, district…" enterkeyhint="search" autocomplete="off" />
        <button type="submit">Search</button>
      </form>`;
const shell = compileTemplate(template)
  .replace(/\s*<script type="module"[\s\S]*?<\/script>/, '')
  .replace('<body class="home">', '<body>')
  .replace(
    '<a class="brand" href="/">Where in Uganda?</a>',
    `<a class="brand" href="/">Where in Uganda?</a>\n      ${headerSearch}`,
  );

const sourceDistricts = loadJson('districts.json');
const sourceCounties = loadJson('counties.json');
const sourceSubs = loadJson('sub_counties.json');
const sourceParishes = loadJson('parishes.json');
const sourceVillages = loadJson('villages.json');

const countiesByDistrict = groupBy(sourceCounties, 'district');
const subsByCounty = groupBy(sourceSubs, 'county');
const parishesBySub = groupBy(sourceParishes, 'subcounty');
const villagesByParish = new Map();
for (const village of sourceVillages) {
  const id = String(village.parish);
  const list = villagesByParish.get(id);
  if (list) list.push(village.name);
  else villagesByParish.set(id, [village.name]);
}

const districtNameById = new Map(sourceDistricts.map((district) => [String(district.id), district.name]));
const countyById = new Map(sourceCounties.map((county) => [String(county.id), county]));
const slugRecords = sourceSubs.map((sub) => {
  const county = countyById.get(String(sub.county));
  if (!county) throw new Error(`Sub-county ${sub.name} is missing its county`);
  const districtName = districtNameById.get(String(county.district));
  if (!districtName) throw new Error(`County ${county.name} is missing its district`);
  return {
    id: String(sub.id),
    name: sub.name,
    countyName: county.name,
    districtName,
  };
});
const subSlugById = assignSubCountySlugs(slugRecords);

const seenSlugs = new Set();
const districts = sourceDistricts.map((district) => {
  const slug = slugify(district.name);
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
      const assigned = subSlugById.get(String(sub.id));
      if (!assigned || assigned.districtSlug !== slug) {
        throw new Error(`Missing slug for ${sub.name} in ${district.name}`);
      }
      const rawParishes = parishesBySub.get(String(sub.id)) ?? [];
      const parishSlugById = assignGroupedSlugs(
        rawParishes.map((parish) => ({
          id: String(parish.id),
          name: parish.name,
          group: `${slug}/${assigned.subSlug}`,
        })),
        'parish',
      );
      const parishes = rawParishes
        .map((parish) => ({
          id: String(parish.id),
          name: parish.name,
          slug: parishSlugById.get(String(parish.id)),
          villages: (villagesByParish.get(String(parish.id)) ?? []).slice().sort((a, b) => a.localeCompare(b, 'en')),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'en') || a.id.localeCompare(b.id, 'en'));
      if (parishes.some((parish) => !parish.slug)) {
        throw new Error(`Missing parish slug under ${sub.name} in ${district.name}`);
      }
      const parishSlugs = new Set(parishes.map((parish) => parish.slug));
      if (parishSlugs.size !== parishes.length) {
        throw new Error(`Duplicate parish slug under ${sub.name} in ${district.name}`);
      }
      const subVillageCount = parishes.reduce((sum, parish) => sum + parish.villages.length, 0);
      subCounties.push({
        name: sub.name,
        countyName: county.name,
        slug: assigned.subSlug,
        parishes,
        villageCount: subVillageCount,
      });
      parishCount += parishes.length;
      villageCount += subVillageCount;
    }
  }
  subCounties.sort((a, b) => a.name.localeCompare(b.name, 'en') || a.countyName.localeCompare(b.countyName, 'en') || a.slug.localeCompare(b.slug, 'en'));
  const subSlugs = new Set(subCounties.map((sub) => sub.slug));
  if (subSlugs.size !== subCounties.length) {
    throw new Error(`Duplicate sub-county slug in ${district.name}`);
  }
  return { ...district, slug, counties, subCounties, parishCount, villageCount };
});

districts.sort((a, b) => a.name.localeCompare(b.name, 'en'));

let addedBytes = 0;
let subCountyBytes = 0;
let subCountyPages = 0;
let parishBytes = 0;
let parishPages = 0;
const subCountyUrls = [];
const parishUrls = [];
for (const [districtIndex, district] of districts.entries()) {
  const neighbors = districts.filter((_, index) => index !== districtIndex && Math.abs(index - districtIndex) <= 3);
  const url = `${ORIGIN}/district/${district.slug}`;
  const title = districtTitle(district.name);
  const description = districtDescription(district);
  const html = renderPage(shell, {
    title: escapeHtml(title),
    description: escapeHtml(description),
    url,
    jsonLd: jsonLdBlock([
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
    ]),
    body: districtBody(district, neighbors),
  });
  finishPage(html, `<h1>${escapeHtml(district.name)} District, Uganda</h1>`);
  addedBytes += writePage(join('district', district.slug, 'index.html'), html);

  for (const sub of district.subCounties) {
    const url = `${ORIGIN}/district/${district.slug}/${sub.slug}`;
    const title = subCountyTitle(sub.name, sub.countyName, district.name);
    const description = subCountyDescription(sub, district.name);
    const subHtml = renderPage(shell, {
      title: escapeHtml(title),
      description: escapeHtml(description),
      url,
      jsonLd: jsonLdBlock([
        breadcrumbList([
          { name: 'Uganda', url: `${ORIGIN}/` },
          { name: `${district.name} District`, url: `${ORIGIN}/district/${district.slug}` },
          { name: sub.countyName },
          { name: `${sub.name} Sub-county`, url },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'AdministrativeArea',
          name: `${sub.name} Sub-county`,
          url,
          containedInPlace: {
            '@type': 'AdministrativeArea',
            name: sub.countyName,
            containedInPlace: {
              '@type': 'AdministrativeArea',
              name: `${district.name} District`,
              url: `${ORIGIN}/district/${district.slug}`,
              containedInPlace: {
                '@type': 'Country',
                name: 'Uganda',
              },
            },
          },
        },
      ]),
      body: subCountyBody(sub, district, district.subCounties.filter((other) => other.countyName === sub.countyName && other.slug !== sub.slug)),
    });
    finishPage(subHtml, `<h1>${escapeHtml(subCountyHeading(sub, district.name))}</h1>`);
    const bytes = writePage(join('district', district.slug, sub.slug, 'index.html'), subHtml);
    addedBytes += bytes;
    subCountyBytes += bytes;
    subCountyPages += 1;
    subCountyUrls.push(url);

    for (const parish of sub.parishes) {
      const parishUrl = `${url}/${parish.slug}`;
      const parishHtml = renderPage(shell, {
        title: escapeHtml(parishTitle(parish.name, sub.name, district.name)),
        description: escapeHtml(parishDescription(parish, sub, district)),
        url: parishUrl,
        jsonLd: jsonLdBlock([
          breadcrumbList([
            { name: 'Uganda', url: `${ORIGIN}/` },
            { name: `${district.name} District`, url: `${ORIGIN}/district/${district.slug}` },
            { name: sub.countyName },
            { name: `${sub.name} Sub-county`, url },
            { name: `${parish.name} Parish`, url: parishUrl },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'AdministrativeArea',
            name: `${parish.name} Parish`,
            url: parishUrl,
            containedInPlace: {
              '@type': 'AdministrativeArea',
              name: `${sub.name} Sub-county`,
              url,
              containedInPlace: {
                '@type': 'AdministrativeArea',
                name: sub.countyName,
                containedInPlace: {
                  '@type': 'AdministrativeArea',
                  name: `${district.name} District`,
                  url: `${ORIGIN}/district/${district.slug}`,
                  containedInPlace: {
                    '@type': 'Country',
                    name: 'Uganda',
                  },
                },
              },
            },
          },
        ]),
        body: parishBody(parish, sub, district, sub.parishes.filter((other) => other.slug !== parish.slug)),
      });
      finishPage(parishHtml, `<h1>${escapeHtml(parishHeading(parish, sub, district))}</h1>`);
      const parishSize = writePage(join('district', district.slug, sub.slug, parish.slug, 'index.html'), parishHtml);
      addedBytes += parishSize;
      parishBytes += parishSize;
      parishPages += 1;
      parishUrls.push(parishUrl);
    }
  }
}

const indexTitle = 'Districts in Uganda | Where in Uganda?';
const indexDescription = `All ${districts.length.toLocaleString('en-US')} districts, with a page for each district's counties and sub-counties.`;
const indexHtml = renderPage(shell, {
  title: escapeHtml(indexTitle),
  description: escapeHtml(indexDescription),
  url: `${ORIGIN}/districts`,
  jsonLd: jsonLdBlock([
    breadcrumbList([
      { name: 'Where in Uganda?', url: `${ORIGIN}/` },
      { name: 'Districts', url: `${ORIGIN}/districts` },
    ]),
  ]),
  body: indexBody(districts),
});
finishPage(indexHtml, '<h1>Districts in Uganda</h1>');
addedBytes += writePage(join('districts', 'index.html'), indexHtml);

function urlset(locs) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locs.map((loc) => `  <url>\n    <loc>${loc}</loc>\n  </url>`).join('\n')}
</urlset>
`;
}

const districtUrls = [
  `${ORIGIN}/`,
  `${ORIGIN}/districts`,
  ...districts.map((district) => `${ORIGIN}/district/${district.slug}`),
];
const sitemapFiles = {
  'sitemap-districts.xml': urlset(districtUrls),
  'sitemap-subcounties.xml': urlset(subCountyUrls),
  'sitemap-parishes.xml': urlset(parishUrls),
};
const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(sitemapFiles).map((name) => `  <sitemap>\n    <loc>${ORIGIN}/${name}</loc>\n  </sitemap>`).join('\n')}
</sitemapindex>
`;
const previousSitemap = statSync(join(dist, 'sitemap.xml'), { throwIfNoEntry: false })?.size ?? 0;
let sitemapBytes = Buffer.byteLength(sitemapIndex) - previousSitemap;
writeFileSync(join(dist, 'sitemap.xml'), sitemapIndex);
for (const [name, xml] of Object.entries(sitemapFiles)) {
  writeFileSync(join(dist, name), xml);
  sitemapBytes += Buffer.byteLength(xml);
}
addedBytes += sitemapBytes;

const POPULAR_DISTRICTS = ['Kampala', 'Wakiso', 'Mukono', 'Mbarara', 'Gulu', 'Jinja', 'Masaka', 'Mbale', 'Arua', 'Lira'];

function homeBrowseHtml(list) {
  const byName = new Map(list.map((district) => [district.name, district]));
  const popular = POPULAR_DISTRICTS.map((name) => byName.get(name)).filter(Boolean);
  if (popular.length !== POPULAR_DISTRICTS.length) {
    throw new Error('A popular district is missing from the directory');
  }
  const groups = new Map();
  for (const district of list) {
    const letter = district.name.slice(0, 1).toUpperCase();
    const rows = groups.get(letter);
    if (rows) rows.push(district);
    else groups.set(letter, [district]);
  }
  const chips = (items) => `<div class="chips dense">${items.map((district) => `<a href="/district/${district.slug}">${escapeHtml(district.name)}</a>`).join('')}</div>`;
  const sections = [...groups.entries()].map(([letter, items]) => `<h3 class="letter">${letter}</h3>\n${chips(items)}`).join('\n');
  return `<section class="home-block" aria-label="Browse by district">
          <h2>Popular</h2>
          ${chips(popular)}
          <h2>Browse by district</h2>
          ${sections}
        </section>`;
}

const browseMarker = '<!-- home-browse -->';
if (!template.includes(browseMarker)) throw new Error('Homepage is missing the district browse marker');
const homepage = template.replace(browseMarker, homeBrowseHtml(districts));
for (const district of districts) {
  if (!homepage.includes(`href="/district/${district.slug}"`)) {
    throw new Error(`Homepage is missing /district/${district.slug}`);
  }
}
if (!homepage.includes('How do I find my parish for NIN registration?') || !homepage.includes('"@type": "WebSite"')) {
  throw new Error('Homepage is missing its guide text or WebSite structured data');
}
if (!homepage.includes('action="/"') || !homepage.includes('name="q"') || !homepage.includes('search_term_string')) {
  throw new Error('Homepage search form must submit to /?q=');
}
if (homepage.includes('id="site-find"') || homepage.includes('id="site-search"')) {
  throw new Error('Homepage still includes the header search form');
}
if (!shell.includes('id="site-find"')) {
  throw new Error('Place pages are missing the header search form');
}
writeFileSync(templatePath, homepage);

const summary = {
  districtPages: districts.length,
  subCountyPages,
  subCountyBytes,
  parishPages,
  parishBytes,
  indexPages: 1,
  sitemap: {
    districts: districtUrls.length,
    subcounties: subCountyUrls.length,
    parishes: parishUrls.length,
    total: districtUrls.length + subCountyUrls.length + parishUrls.length,
  },
  addedBytes,
  prerenderMs: Math.round(performance.now() - prerenderStarted),
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
