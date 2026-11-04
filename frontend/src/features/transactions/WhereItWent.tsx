import { UnstyledButton } from '@mantine/core';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import { FadingScrollArea } from '../../shared/ui/FadingScrollArea';
import { shareText } from './calendar';
import classes from './TransactionsPage.module.css';
import type { CategoryTotal } from './transactionsApi';

interface WhereItWentProps {
  /** The period's categories, largest first (the picked one left out of their filter). */
  categories: CategoryTotal[];
  currency: string;
  /** Income's own categories, in green: "Where it came from". */
  income: boolean;
  picked?: string;
  /** A tap on the picked one shows them all again. */
  onPick: (categoryId: string | undefined) => void;
  /**
   * `column`: the desktop's left column, the list scrolling inside it; `menu`: a sheet or a dropdown, with "All
   * categories" first.
   */
  place: 'column' | 'menu';
}

/**
 * Where it went (F-020, variant 5's bars): each category's amount and share of the period's spending, a bar as long
 * as its part of the largest. A tap shows only that category, in the calendar and the receipts too.
 */
export function WhereItWent({
  categories,
  currency,
  income,
  picked,
  onPick,
  place,
}: WhereItWentProps) {
  const { t } = useTranslation();
  const titleId = useId();
  if (!categories.length) return null;

  const sum = categories.reduce((total, category) => total + category.amount, 0);
  const max = categories[0]?.amount ?? 0;
  const title = t(income ? 'transactions.where.received' : 'transactions.where.spent');

  const bars = (
    <ul className={classes.bars}>
      {categories.map((category) => (
        <li key={category.categoryId}>
          <UnstyledButton
            className={classes.bar}
            aria-pressed={category.categoryId === picked}
            style={{
              '--width': `${(max > 0 ? Math.max(2, (category.amount / max) * 100) : 2).toFixed(1)}%`,
            }}
            onClick={() => {
              onPick(category.categoryId === picked ? undefined : category.categoryId);
            }}
          >
            <span className={classes.barName}>{category.name}</span>
            <span className={classes.barAmount}>{formatMoney(category.amount, currency)}</span>
            <span className={classes.barShare}>{shareText(category.amount, sum)}</span>
            <span className={classes.track} aria-hidden="true">
              <span />
            </span>
          </UnstyledButton>
        </li>
      ))}
    </ul>
  );

  if (place === 'menu') {
    return (
      <section
        className={classes.where}
        data-in-menu
        data-income={income || undefined}
        aria-label={title}
      >
        <UnstyledButton
          className={cx(classes.bar, classes.allBar)}
          aria-pressed={!picked}
          onClick={() => {
            onPick(undefined);
          }}
        >
          <span className={classes.barName}>{t('transactions.where.all')}</span>
          <span className={classes.barAmount}>{formatMoney(sum, currency)}</span>
        </UnstyledButton>
        {bars}
      </section>
    );
  }

  return (
    <section className={classes.where} data-income={income || undefined} aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      <FadingScrollArea className={classes.whereScroll}>{bars}</FadingScrollArea>
    </section>
  );
}
