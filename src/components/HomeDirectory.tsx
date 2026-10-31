import districts from '../data/districts.json';
import { slugify } from '../utils/placeSlugs.ts';

const POPULAR = ['Kampala', 'Wakiso', 'Mukono', 'Mbarara', 'Gulu', 'Jinja', 'Masaka', 'Mbale', 'Arua', 'Lira'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const ALL = [...districts].sort((a, b) => a.name.localeCompare(b.name, 'en'));
const BY_NAME = new Map(ALL.map((district) => [district.name, district]));

function Chip({ name }: { name: string }) {
  return <a href={`/district/${slugify(name)}`}>{name}</a>;
}

export function HomeDirectory() {
  const popular = POPULAR.flatMap((name) => {
    const district = BY_NAME.get(name);
    return district ? [district] : [];
  });

  return (
    <section className="home-block" aria-label="Browse by district">
      <h2>Popular</h2>
      <div className="chips dense">
        {popular.map((district) => <Chip key={district.id} name={district.name} />)}
      </div>
      <h2>Browse by district</h2>
      {LETTERS.map((letter) => {
        const group = ALL.filter((district) => district.name.toUpperCase().startsWith(letter));
        if (group.length === 0) return null;
        return (
          <div key={letter}>
            <h3 className="letter">{letter}</h3>
            <div className="chips dense">
              {group.map((district) => <Chip key={district.id} name={district.name} />)}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export function HomeGuide() {
  return (
    <div className="guide">
      <h2>How to find the names for your form</h2>
      <ol>
        <li>Type a village, parish, town or district into the search box.</li>
        <li>Open a result. For a village, the path reads district, county, sub-county, parish, then the village.</li>
        <li>Copy the parish, sub-county and district onto your NIN, NIRA, KCCA or school form. If you are unsure of the spelling, tap Use my location and check the places listed near you.</li>
      </ol>
      <h2>Common questions</h2>
      <section>
        <h3>How do I find my parish for NIN registration?</h3>
        <p>Search for your village name and open the result that matches. The path shown with a village runs district, county, sub-county, parish, then village. The parish is the name immediately before the village. Use that parish, with the sub-county and district, on the NIN or NIRA form.</p>
      </section>
      <section>
        <h3>What is the difference between a county and a sub-county?</h3>
        <p>A county is the larger area inside a district. A sub-county sits inside a county, and parishes sit inside the sub-county. On every village in this search the path is district, county, sub-county, parish, then village, so the county is the second name and the sub-county is the third.</p>
      </section>
      <section>
        <h3>Is it free?</h3>
        <p>Yes. Searching for a village, parish, sub-county, county or district is free.</p>
      </section>
      <section>
        <h3>How many locations are covered?</h3>
        <p>The search covers more than 84,000 locations, including villages, parishes, sub-counties, counties and districts.</p>
      </section>
      <section>
        <h3>Can I use this for KCCA and school forms?</h3>
        <p>Yes. The village, parish, sub-county and district on a result are the names people copy onto KCCA documents and school forms, as well as NIN and NIRA forms.</p>
      </section>
      <section>
        <h3>What if the same place name appears more than once?</h3>
        <p>Open each result and compare the path: district, county, sub-county and parish. Pick the one that matches the area you mean. You can also filter the search to parish, sub-county, county, district or village.</p>
      </section>
    </div>
  );
}
