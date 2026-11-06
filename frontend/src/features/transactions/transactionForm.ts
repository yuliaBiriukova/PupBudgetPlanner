import { createContext, useContext, useEffect } from 'react';
import type { BalanceChange, Transaction } from './transactionsApi';

/** What was saved or deleted last: the pages light up its row and its account's card. */
export interface LastChange {
  /** Counts up with every change, so the same transaction saved twice lights up twice. */
  key: number;
  /** Empty after a delete. */
  transactionId?: string;
  /** The balances it changed: the Accounts page lights up the card and counts its totals. */
  balances: BalanceChange[];
}

export interface TransactionFormApi {
  /**
   * Opens the form for a new transaction; from an account's card, with that account picked (F-018). It starts on
   * `date`, else on the day the page shows (I-025), else on today.
   */
  add: (options?: { accountId?: string; date?: string }) => void;
  /** Opens the form to change or delete a transaction. */
  edit: (transaction: Transaction) => void;
  /** The day the page shows (`YYYY-MM-DD`), or none: every Add transaction starts on it, the shell's too. */
  showDay: (day: string | undefined) => void;
  lastChange?: LastChange;
}

export const TransactionFormContext = createContext<TransactionFormApi | null>(null);

/** The quick-add form, from anywhere inside the app shell (`TransactionFormProvider`). */
export function useTransactionForm(): TransactionFormApi {
  const api = useContext(TransactionFormContext);
  if (!api) throw new Error('useTransactionForm needs a TransactionFormProvider around it.');
  return api;
}

/** While a page shows one day, a new transaction starts on it (I-025); leaving the page forgets it. */
export function useFormDay(day: string | undefined) {
  const { showDay } = useTransactionForm();
  useEffect(() => {
    showDay(day);
    return () => {
      showDay(undefined);
    };
  }, [day, showDay]);
}

/**
 * Escape closes a picker, not the form under it: the form's dialog or sheet leaves keys from elements marked with
 * `data-mantine-stop-propagation` alone (as the currency list does, F-016).
 */
export const KEEP_FORM_OPEN = { 'data-mantine-stop-propagation': true } as const;
