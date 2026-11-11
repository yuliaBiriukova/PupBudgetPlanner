import { VisuallyHidden } from '@mantine/core';
import { useEffect, useId, useRef, type ReactNode } from 'react';
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
  /** Its name over the number: "Amount", or an exchange's side ("From Mono dollars", F-019). */
  label?: string;
  /** An exchange's second amount (F-019): a smaller number under the first. */
  secondary?: boolean;
  /** The app's keys are up and type into it (the phone): it is kept in sight above them (B-012). */
  typedInto?: boolean;
  /** The app's keys type into it (the phone, an exchange): the ring says so. */
  target?: boolean;
  /** A tap or a click on it: on the phone the keys move to it. */
  onTarget?: () => void;
  /** It holds a suggestion (the NBU's amount): selected when it takes the focus, so typing replaces it. */
  selectOnFocus?: boolean;
  /** Under the number: an exchange's rate line. */
  children?: ReactNode;
}

/**
 * The amount on a calculator display (F-018 final prototype): right-aligned in the type's color with the account's
 * currency, no sign before it (the color and the type switch say which it is). A sum is shown as arithmetic in the
 * text's color, its result on the top line. An exchange (F-019) has two: the amount From, and a smaller one for what To
 * got, with the rate under it.
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
  label,
  secondary,
  typedInto,
  target,
  onTarget,
  selectOnFocus,
  children,
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

  // On the phone the display the keys type into stays in sight above them as they come up and on every key, with its
  // rate line (an exchange's To sits low in the form, F-019): the form's room shrinks under the keys and keeps its
  // scroll, so a display low in it would be left under them (B-012)
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typedInto || target || error) root.current?.scrollIntoView({ block: 'nearest' });
  }, [typedInto, target, error, value]);

  const sign = <span className={classes.sign}>{currencySign(currency)}</span>;

  return (
    <div
      ref={root}
      className={classes.display}
      data-type={type}
      data-sum={sum || undefined}
      data-invalid={error ? true : undefined}
      data-secondary={secondary ? true : undefined}
      data-target={target ? true : undefined}
      onClick={() => {
        input.current?.focus();
        onTarget?.();
      }}
    >
      <div className={classes.displayHead}>
        <label htmlFor={id}>{label ?? t('transactions.form.amount')}</label>
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
            onFocus={(event) => {
              if (selectOnFocus) event.currentTarget.select();
            }}
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
      {children}
      {error && <VisuallyHidden id={`${id}-error`}>{error}</VisuallyHidden>}
    </div>
  );
}
