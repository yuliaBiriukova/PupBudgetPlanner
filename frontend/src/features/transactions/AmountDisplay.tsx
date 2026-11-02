import { VisuallyHidden } from '@mantine/core';
import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { currencySign, formatMoney, signBefore } from '../../shared/format/money';
import { evaluate, fromTyped, isSum, showExpression } from './amount';
import classes from './TransactionForm.module.css';
import type { TransactionType } from './transactionsApi';

interface AmountDisplayProps {
  /** What the field holds: an amount or a sum being typed (`amount.ts`). */
  value: string;
  onChange: (value: string) => void;
  type: TransactionType;
  currency: string;
  /** The app's own keys type into it (the phone): the phone's keyboard stays closed. */
  withKeys: boolean;
  /** Read out only: the red display is enough to see (owner, 2026-11-01, DESIGN_RULES custom rules). */
  error?: string;
  /** Enter saves, working a sum out on the way, as Save does. */
  onEnter: () => void;
  /** Takes the focus as the form appears (the desktop: the amount is typed first). */
  focusFirst?: boolean;
}

/**
 * The amount on a calculator display (F-018 final prototype): right-aligned in the type's color with the account's
 * currency, no sign before it (the color and the Expense / Income switch say which it is). A sum is shown as
 * arithmetic in the text's color, its result on the top line.
 */
export function AmountDisplay({
  value,
  onChange,
  type,
  currency,
  withKeys,
  error,
  onEnter,
  focusFirst,
}: AmountDisplayProps) {
  const { t } = useTranslation();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const sum = isSum(value);
  const result = evaluate(value);
  const shown = showExpression(value);
  const before = signBefore(currency);

  // The dialog focuses it when it opens with the form (data-autofocus); when the form appears later, once its data is
  // there, the dialog has given the focus to its close button already
  useEffect(() => {
    if (focusFirst) input.current?.focus();
  }, [focusFirst]);

  const sign = <span className={classes.sign}>{currencySign(currency)}</span>;

  return (
    <div
      className={classes.display}
      data-type={type}
      data-sum={sum || undefined}
      data-invalid={error ? true : undefined}
      onClick={() => input.current?.focus()}
    >
      <div className={classes.displayHead}>
        <label htmlFor={id}>{t('transactions.form.amount')}</label>
        <span aria-live="polite">
          {sum && (
            <span className={classes.result} data-low={result === null || result <= 0 || undefined}>
              {`= ${formatMoney(result ?? 0, currency)}`}
            </span>
          )}
        </span>
      </div>
      <div className={classes.big}>
        {/* A sum is arithmetic, not yet the amount: no currency until it is worked out */}
        {!sum && before && sign}
        <span className={classes.sizer} data-value={shown === '' ? '0' : shown}>
          <input
            ref={input}
            id={id}
            className={classes.amountInput}
            value={shown}
            placeholder="0"
            inputMode={withKeys ? 'none' : 'decimal'}
            autoComplete="off"
            data-autofocus={focusFirst ? true : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(event) => {
              onChange(fromTyped(event.currentTarget.value));
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onEnter();
              }
            }}
          />
        </span>
        {!sum && !before && sign}
      </div>
      {error && <VisuallyHidden id={`${id}-error`}>{error}</VisuallyHidden>}
    </div>
  );
}
