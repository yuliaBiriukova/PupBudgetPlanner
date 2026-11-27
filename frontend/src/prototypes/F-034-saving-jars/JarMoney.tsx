import { IconAlertTriangle } from '@tabler/icons-react';
import { useId, type CSSProperties } from 'react';
import type { Account } from '../../features/accounts/accountsApi';
import { OVERVIEW } from '../../features/accounts/accountsTestData';
import { formatMoney } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import { inJarsOf } from './jars';
import classes from './Jars.module.css';
import { useJarWorld } from './worldContext';

const m = formatMoney;

/** Darkest for the biggest jar, lighter for each next: shades of the text colour, as the Budget's *Where the … goes*. */
const shade = (index: number) => `${String(Math.max(24, 92 - index * 30))}%`;

/**
 * Where the jar money lies (owner, 2026-11-27: variant 2, *Bars*, without the jars' colours): each account holding jar
 * money with its balance and one bar, a piece per jar in shades of the text colour (darkest the biggest), the free rest
 * an outline; under it the jars with their amounts and, on the right, what is free or how short the jars are. Two or
 * three accounts in a row on a wide screen.
 */
export function JarMoney() {
  const heading = useId();
  const world = useJarWorld();
  const holding = OVERVIEW.accounts
    .map((account) => {
      const inside = inJarsOf(account, world.moves);
      return { account, inside, free: account.balance - inside };
    })
    .filter((a) => a.inside !== 0);
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
              <span className={classes.moneyBar} aria-hidden>
                {pieces.map(({ jar, amount }, index) => (
                  <span
                    key={jar.id}
                    className={classes.moneyJar}
                    style={{ '--part': share(amount), '--shade': shade(index) } as CSSProperties}
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
                  {pieces.map(({ jar, amount }, index) => (
                    <span key={jar.id} className={classes.barJar}>
                      <span
                        className={classes.barDot}
                        style={{ '--shade': shade(index) } as CSSProperties}
                        aria-hidden
                      />
                      {jar.name} <span className={classes.num}>{m(amount, account.currency)}</span>
                    </span>
                  ))}
                </span>
                {free < 0 ? (
                  <span className={classes.rowWarn}>
                    <IconAlertTriangle size={16} stroke={1.7} aria-hidden />
                    {m(-free, account.currency)} of jar money spent
                  </span>
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
