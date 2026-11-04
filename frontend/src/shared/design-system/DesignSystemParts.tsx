import type { ReactNode } from 'react';
import classes from './DesignSystem.module.css';

// Story-only building blocks of the "Design system" pages (I-019).

export function Page({ intro, children }: { intro: ReactNode; children: ReactNode }) {
  return (
    <div className={classes.page}>
      <p className={classes.intro}>{intro}</p>
      {children}
    </div>
  );
}

export function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={classes.section}>
      <h2 className={classes.sectionTitle}>{title}</h2>
      {note && <p className={classes.sectionNote}>{note}</p>}
      {children}
    </section>
  );
}

/** One colour token: its swatch, its name and its value in the column's scheme. */
export function Swatch({ token, value }: { token: string; value: string }) {
  return (
    <div className={classes.swatch}>
      <span className={classes.chip} style={{ background: `var(${token})` }} />
      <span className={classes.token}>
        {token}
        <br />
        <span className={classes.value}>{value}</span>
      </span>
    </div>
  );
}

/** A column in one colour scheme: the scheme's variables are set on it, so everything inside resolves to them. */
export function SchemeColumn({
  title,
  variables,
  children,
}: {
  title: string;
  variables: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <div className={classes.scheme} style={variables}>
      <h3 className={classes.schemeTitle}>{title}</h3>
      {children}
    </div>
  );
}

/** A sample with its spec (sizes, weights, the token) under it. */
export function Sample({ spec, children }: { spec: string; children: ReactNode }) {
  return (
    <div className={classes.sample}>
      {children}
      <span className={classes.spec}>{spec}</span>
    </div>
  );
}

/** One element of the app: the sample, its name and where it is used. */
export function Spec({
  name,
  where,
  children,
}: {
  name: string;
  where: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={classes.specRow}>
      <div className={classes.specSample}>{children}</div>
      <div className={classes.specText}>
        <span className={classes.specName}>{name}</span>
        <span className={classes.specWhere}>{where}</span>
      </div>
    </div>
  );
}

export function Specs({ children }: { children: ReactNode }) {
  return <div className={classes.specs}>{children}</div>;
}
