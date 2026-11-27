import { Button } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useId, type CSSProperties } from 'react';
import type { Account } from '../../features/accounts/accountsApi';
import { OVERVIEW } from '../../features/accounts/accountsTestData';
import { formatMoney } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import { inHryvnias, jarStyle, splitTotal } from './jarHelpers';
import { inJarsOf, type Jar } from './jars';
import classes from './Jars.module.css';
import { useJarWorld } from './worldContext';

/**
 * The block under the shelf (owner, 2026-11-27: "Where the jar money lies" seemed redundant or not straightforward):
 * - `list`: the final prototype's list as it was, its title now an h2 like the app's other section headings;
 * - `short`: nothing while every account covers its jars; a warning only for an account whose jars are short;
 * - `bars`: each account with jar money, its balance split in one bar: in jars and free;
 * - `sum`: every account's free money, in a small table adding up to *Free to spend* on top.
 */
export type JarMoneyKind = 'list' | 'short' | 'bars' | 'sum';

export function JarMoney({
  kind,
  onTakeOut,
}: {
  kind: JarMoneyKind;
  onTakeOut: (jar: Jar) => void;
}) {
  if (kind === 'short') return <OnlyShort onTakeOut={onTakeOut} />;
  if (kind === 'bars') return <Bars />;
  if (kind === 'sum') return <HowFreeAddsUp />;
  return <List />;
}

const m = formatMoney;

function useHolding() {
  const world = useJarWorld();
  return OVERVIEW.accounts
    .map((account) => {
      const inside = inJarsOf(account, world.moves);
      return { account, inside, free: account.balance - inside };
    })
    .filter((a) => a.inside !== 0);
}

function ShortLine({ account, free }: { account: Account; free: number }) {
  return (
    <span className={classes.rowWarn}>
      <IconAlertTriangle size={16} stroke={1.7} aria-hidden />
      Jars short by {m(-free, account.currency)}
    </span>
  );
}

/** The final prototype's list, its title an h2 heading. */
function List() {
  const heading = useId();
  const holding = useHolding();
  return (
    <section className={classes.freeList} aria-labelledby={heading}>
      <h2 id={heading} className={classes.sectionHead}>
        Where the jar money lies
      </h2>
      <ul className={classes.rows}>
        {holding.map(({ account, inside, free }) => (
          <li key={account.id} className={classes.row}>
            <span className={classes.rowMain}>
              {account.name}
              <span className={cx(classes.rowDate, free < 0 && classes.over)}>
                {free < 0 ? (
                  <ShortLine account={account} free={free} />
                ) : (
                  `${m(free, account.currency)} free of ${m(account.balance, account.currency)}`
                )}
              </span>
            </span>
            <span className={classes.num}>{m(inside, account.currency)} in jars</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * 1. Only when short: the shelf and the two totals say it all; which account holds a jar's money is in the jar's own
 * window, and each account's free money on the Accounts page. Here only what needs doing.
 */
function OnlyShort({ onTakeOut }: { onTakeOut: (jar: Jar) => void }) {
  const heading = useId();
  const world = useJarWorld();
  const short = useHolding().filter((a) => a.free < 0);
  // The jar with the most money on that account: Take out opens its dialog with the account picked first
  const jarOn = (account: Account) =>
    world.jars
      .filter((j) => !j.closed)
      .map((jar) => ({
        jar,
        amount: world.moves
          .filter((mv) => mv.jarId === jar.id && mv.accountId === account.id)
          .reduce((sum, mv) => sum + (mv.accountAmount ?? mv.amount), 0),
      }))
      .sort((a, b) => b.amount - a.amount)[0]?.jar;
  if (short.length === 0) return null;
  return (
    <section className={classes.shortBox} aria-labelledby={heading}>
      <h2 id={heading} className={classes.sectionHead}>
        <IconAlertTriangle size={20} stroke={1.7} aria-hidden className={classes.shortIcon} />
        {short.length === 1
          ? 'An account is short of its jar money'
          : 'Accounts short of jar money'}
      </h2>
      <ul className={classes.rows}>
        {short.map(({ account, inside, free }) => (
          <li key={account.id} className={classes.shortRow}>
            <p className={classes.shortText}>
              <strong>{account.name}</strong> has{' '}
              <span className={classes.num}>{m(account.balance, account.currency)}</span>, but its
              jars hold <span className={classes.num}>{m(inside, account.currency)}</span>:{' '}
              <span className={cx(classes.num, classes.over)}>
                {m(-free, account.currency)} of the jar money was spent.
              </span>{' '}
              Take it out of a jar, or top the account up.
            </p>
            <Button
              variant="default"
              onClick={() => {
                const jar = jarOn(account);
                if (jar) onTakeOut(jar);
              }}
            >
              Take out
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * 2. Bars: each account's balance as one bar, a piece per jar in the jar's own colour, the free part an outline; the
 * jars named under it. Two or three accounts in a row on a wide screen.
 */
function Bars() {
  const heading = useId();
  const world = useJarWorld();
  const holding = useHolding();
  const piecesOf = (account: Account) =>
    world.jars
      .map((jar) => ({
        jar,
        amount: world.moves
          .filter((mv) => mv.jarId === jar.id && mv.accountId === account.id)
          .reduce((sum, mv) => sum + (mv.accountAmount ?? mv.amount), 0),
      }))
      .filter((p) => p.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  return (
    <section className={classes.freeList} aria-labelledby={heading}>
      <h2 id={heading} className={classes.sectionHead}>
        Where the jar money lies
      </h2>
      <ul className={classes.barGrid}>
        {holding.map(({ account, inside, free }) => {
          const whole = Math.max(account.balance, inside);
          const share = (amount: number) => `${String(whole > 0 ? (amount / whole) * 100 : 0)}%`;
          const pieces = piecesOf(account);
          return (
            <li key={account.id} className={classes.barRow}>
              <span className={classes.barTop}>
                <span>{account.name}</span>
                <span className={classes.num}>{m(account.balance, account.currency)}</span>
              </span>
              <span className={cx(classes.moneyBar, free < 0 && classes.moneyShort)} aria-hidden>
                {pieces.map(({ jar, amount }) => (
                  <span
                    key={jar.id}
                    className={classes.moneyJar}
                    style={{ ...jarStyle(jar.color), '--part': share(amount) } as CSSProperties}
                  />
                ))}
                {free > 0 && (
                  <span
                    className={classes.moneyFree}
                    style={{ '--part': share(free) } as CSSProperties}
                  />
                )}
              </span>
              <span className={classes.barBottom}>
                <span className={classes.barJars}>
                  {pieces.map(({ jar, amount }) => (
                    <span key={jar.id} className={classes.barJar}>
                      <span className={classes.barDot} style={jarStyle(jar.color)} aria-hidden />
                      {jar.name} <span className={classes.num}>{m(amount, account.currency)}</span>
                    </span>
                  ))}
                </span>
                {free < 0 ? (
                  <ShortLine account={account} free={free} />
                ) : (
                  <span className={cx(classes.num, classes.dim)}>
                    {m(free, account.currency)} free
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * 3. How *Free to spend* adds up: every account, jars or not, with what is in jars and what is free (together its balance); the free column in
 * hryvnias adds up to the number on top (a short account takes its shortfall off, owner 2026-11-27).
 */
function HowFreeAddsUp() {
  const heading = useId();
  const world = useJarWorld();
  const { free: total } = splitTotal(world.moves);
  const rows = OVERVIEW.accounts.map((account) => {
    const inside = inJarsOf(account, world.moves);
    return { account, inside, free: account.balance - inside };
  });
  return (
    <section className={classes.freeList} aria-labelledby={heading}>
      <h2 id={heading} className={classes.sectionHead}>
        How the {m(total, 'UAH')} free adds up
      </h2>
      <table className={classes.sumTable}>
        <thead>
          <tr>
            <th scope="col">Account</th>
            <th scope="col">In jars</th>
            <th scope="col">Free</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ account, inside, free }) => (
            <tr key={account.id}>
              <th scope="row">{account.name}</th>
              <td className={cx(classes.num, inside === 0 && classes.dim)}>
                {inside === 0 ? '—' : m(inside, account.currency)}
              </td>
              <td className={cx(classes.num, free < 0 && classes.over)}>
                {m(free, account.currency)}
                {account.currency !== 'UAH' && (
                  <small className={classes.dim}>
                    {m(Math.round(inHryvnias(free, account.currency)), 'UAH')}
                  </small>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={2}>
              Free to spend, in UAH at today’s NBU rate
            </th>
            <td className={classes.num}>{m(total, 'UAH')}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
