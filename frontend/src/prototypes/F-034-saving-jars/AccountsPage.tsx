import { Button, SegmentedControl, Title, UnstyledButton } from '@mantine/core';
import { IconAlertTriangle, IconPlus } from '@tabler/icons-react';
import { useState, type CSSProperties } from 'react';
import cardClasses from '../../features/accounts/AccountCard.module.css';
import { groupAccounts, type GroupBy } from '../../features/accounts/accountGroups';
import pageClasses from '../../features/accounts/Accounts.module.css';
import type { Account } from '../../features/accounts/accountsApi';
import { OVERVIEW, TOTAL } from '../../features/accounts/accountsTestData';
import { TotalRates } from '../../features/accounts/TotalRates';
import { formatMoney } from '../../shared/format/money';
import { useCurrencyTitle } from '../../shared/i18n/currencyNames';
import { cx } from '../../shared/ui/cx';
import { splitTotal } from './jarHelpers';
import { inJarsOf } from './jars';
import classes from './Jars.module.css';
import { useJarWorld } from './worldContext';

/**
 * The Accounts page with the jars' money on it: In total says what is free and what is in jars; every account card
 * with jar money says what of it is free, above its balance (owner, 2026-11-19: "Free only" of the three ways shown).
 * A card whose jar money was spent says how much of it, in the card's debt colour.
 *
 * `cardFit` (owner, 2026-11-27): "1 789 ₴ of jar money spent" is wider than a five-in-a-row card at 1920 px. `wrap`: it
 * takes two lines and the whole row grows; `short`: the card says only "1 789 ₴ spent"; `four`: at most four cards a
 * row, each at least 260 px. Without it the line is cut off there.
 */
export type CardFit = 'wrap' | 'short' | 'four';

export function AccountsPage({ cardFit }: { cardFit?: CardFit }) {
  const world = useJarWorld();
  const [groupBy, setGroupBy] = useState<GroupBy>('currency');
  const currencyTitle = useCurrencyTitle();
  const { inJars, free } = splitTotal(world.moves);

  return (
    <>
      <header className={pageClasses.head}>
        <Title order={1} className={pageClasses.title}>
          Accounts
        </Title>
        <Button className={pageClasses.addButton} leftSection={<IconPlus size={20} stroke={1.7} />}>
          Add account
        </Button>
      </header>
      <div className={pageClasses.toolbar}>
        <span className={pageClasses.groupByLabel} aria-hidden="true">
          Group by
        </span>
        <SegmentedControl
          aria-label="Group accounts by"
          value={groupBy}
          onChange={(value) => {
            setGroupBy(value === 'source' ? 'source' : 'currency');
          }}
          data={[
            { value: 'currency', label: 'Currency' },
            { value: 'source', label: 'Source' },
          ]}
          className={pageClasses.switch}
        />
      </div>

      <div className={pageClasses.totals} role="group" aria-label="Totals">
        <div className={pageClasses.grand}>
          <p className={pageClasses.totalsLabel}>In total, in UAH</p>
          <span className={pageClasses.grandAmount}>{formatMoney(TOTAL.total ?? 0, 'UAH')}</span>
          <div className={classes.split}>
            <span className={classes.splitItem}>
              Free <strong className={classes.num}>{formatMoney(free, 'UAH')}</strong>
            </span>
            <span className={classes.splitItem}>
              In jars <strong className={classes.num}>{formatMoney(inJars, 'UAH')}</strong>
            </span>
          </div>
          <TotalRates total={TOTAL} />
        </div>
      </div>

      <div className={pageClasses.groups}>
        {groupAccounts(OVERVIEW, groupBy).map((group) => (
          <section key={group.id} className={pageClasses.group}>
            <div className={pageClasses.groupHead}>
              <div className={pageClasses.groupTitle}>
                <h2>
                  {group.key.by === 'currency'
                    ? currencyTitle(group.key.currency)
                    : group.key.by === 'cash'
                      ? 'Cash'
                      : group.key.by === 'bank'
                        ? group.key.bank
                        : group.key.name}
                </h2>
                <span className={pageClasses.caption}>
                  {group.accounts.length} {group.accounts.length === 1 ? 'account' : 'accounts'}
                </span>
              </div>
              {group.key.by === 'currency' && (
                <span className={pageClasses.groupTotal}>
                  {formatMoney(group.key.total, group.key.currency)}
                </span>
              )}
            </div>
            <ul
              className={cx(
                pageClasses.cards,
                classes.fiveCards,
                cardFit === 'wrap' && classes.fitWrap,
                cardFit === 'four' && classes.fitFour,
              )}
            >
              {group.accounts.map((account) => (
                <li key={account.id}>
                  <FreeCard
                    account={account}
                    meta={groupBy === 'currency' ? sourceOf(account) : undefined}
                    code={groupBy === 'source' ? account.currency : undefined}
                    inJars={inJarsOf(account, world.moves)}
                    short={cardFit === 'short'}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function sourceOf(account: Account): string {
  return account.source === 'Cash'
    ? 'Cash'
    : account.source === 'Bank'
      ? (account.bankName ?? '')
      : (account.sourceName ?? '');
}

/**
 * `AccountCard` copied for the prototype: a card with jar money says above its balance what of it is free; when
 * spending ate into the jar money, how much the jars are short instead of a free amount below zero.
 */
function FreeCard({
  account,
  meta,
  code,
  inJars,
  short = false,
}: {
  account: Account;
  meta?: string;
  code?: string;
  inJars: number;
  short?: boolean;
}) {
  const free = account.balance - inJars;
  const amount = formatMoney(account.balance, account.currency);

  return (
    <div className={cardClasses.withEdge} data-style={account.cardStyle}>
      <UnstyledButton
        className={cx(cardClasses.card, pageClasses.card, classes.fitCard)}
        data-style={account.cardStyle}
        data-edge
      >
        <span className={cardClasses.top}>
          <span className={cardClasses.name}>{account.name}</span>
          {code && <span className={cardClasses.code}>{code}</span>}
          {meta && <span className={cardClasses.meta}>{meta}</span>}
        </span>
        <span className={classes.cardMoney}>
          {inJars !== 0 && (
            <span className={cx(classes.cardLine, free < 0 && classes.cardWarn)}>
              {free < 0 && <IconAlertTriangle size={16} stroke={1.7} aria-hidden />}
              {free < 0
                ? `${formatMoney(-free, account.currency)}${short ? ' spent' : ' of jar money spent'}`
                : `${formatMoney(free, account.currency)} free`}
            </span>
          )}
          <span
            className={cx(cardClasses.balance, account.balance < 0 && cardClasses.debt)}
            style={{ '--chars': amount.length, display: 'block' } as CSSProperties}
          >
            {amount}
          </span>
        </span>
      </UnstyledButton>

      <UnstyledButton
        className={cardClasses.edge}
        aria-label={`Add a transaction from ${account.name}`}
      >
        <IconPlus size={20} stroke={1.7} aria-hidden />
      </UnstyledButton>
    </div>
  );
}
