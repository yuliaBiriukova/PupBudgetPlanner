import { IconAlertTriangle } from '@tabler/icons-react';
import { useId, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import type { Account } from '../accounts/accountsApi';
import { holdingAccounts, shade } from './jars';
import type { Jar } from './jarsApi';
import classes from './Jars.module.css';

/**
 * Where the jar money lies (owner, 2026-11-27: *Bars* without the jars' colours): each account holding jar money with
 * its balance and one bar, a piece per jar in shades of the text colour (darkest the biggest), the free rest an
 * outline; under it the jars with their amounts and, on the right, what is free or how much of the jar money was spent.
 * Two or three accounts in a row on a wide screen.
 */
export function JarMoney({ jars, accounts }: { jars: Jar[]; accounts: Account[] }) {
  const { t } = useTranslation();
  const heading = useId();
  const holding = holdingAccounts(jars, accounts);
  if (holding.length === 0) return null;

  return (
    <section className={classes.freeList} aria-labelledby={heading}>
      <h2 id={heading} className={classes.sectionHead}>
        {t('jars.where.title')}
      </h2>
      <ul className={classes.barGrid}>
        {holding.map(({ account, pieces, inJars, free }) => {
          const whole = Math.max(account.balance, inJars);
          const share = (amount: number) => `${String(whole > 0 ? (amount / whole) * 100 : 0)}%`;
          const money = (amount: number) => formatMoney(amount, account.currency);
          return (
            <li key={account.id} className={classes.barRow} data-testid="jar-money-account">
              <span className={classes.barTop}>
                <span>{account.name}</span>
                <span className={classes.num}>{money(account.balance)}</span>
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
                      {jar.name} <span className={classes.num}>{money(amount)}</span>
                    </span>
                  ))}
                </span>
                {free < 0 ? (
                  <span className={classes.rowWarn}>
                    <IconAlertTriangle size={16} stroke={1.7} aria-hidden />
                    {t('jars.where.spent', { amount: money(-free) })}
                  </span>
                ) : (
                  <span className={cx(classes.num, classes.dim)}>
                    {t('jars.where.free', { amount: money(free) })}
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
