import type { ReactNode } from 'react';

export type Crumb = { name: string; href?: string };
export type FormField = { label: string; value: string };

export function PlaceFrame({
  crumbs,
  fields,
  hint,
  children,
}: {
  crumbs: Crumb[];
  fields: FormField[];
  hint: string;
  children?: ReactNode;
}) {
  return (
    <div className="place place-in-app">
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((crumb, index) => (
          <span className="crumb" key={`${crumb.name}-${index}`}>
            {index > 0 && <span aria-hidden="true">/</span>}
            {crumb.href
              ? <a href={crumb.href}>{crumb.name}</a>
              : <span aria-current={index === crumbs.length - 1 ? 'page' : undefined}>{crumb.name}</span>}
          </span>
        ))}
      </nav>
      <section className="copy-form">
        <h2>Copy for your form</h2>
        <p className="hint">{hint}</p>
        <dl>
          {fields.map((field) => (
            <div key={field.label}>
              <dt>{field.label}</dt>
              <dd>{field.value || '—'}</dd>
            </div>
          ))}
        </dl>
        <button type="button" data-copy-form>Copy for your form</button>
      </section>
      {children}
    </div>
  );
}
