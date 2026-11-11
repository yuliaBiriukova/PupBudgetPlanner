import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { afterPopupsClose, onPopupStep } from '../../shared/ui/popupHistory';
import { filtersFrom, paramsOf, type Filters } from './filters';

/**
 * The page's filters, kept in its address (`filters.ts`). A change goes into the address at once, replacing it, so
 * Back leaves the page rather than stepping through every pick. While a phone sheet is open its history step is the
 * current entry (I-015): the picks wait in the page until `settle` is called as the sheet closes, then go into the
 * address once the step is gone. They stay in the page until the address has them: the router changes it a moment
 * later, and in between the page would show no filters at all (B-017).
 */
export function useTransactionFilters() {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState<Filters | null>(null);
  /** The address as it was when the settled picks were written to it, until it has them. */
  const [writtenFrom, setWrittenFrom] = useState<string | null>(null);
  const pending = useRef<Filters | null>(null);
  const address = params.toString();

  // The address has moved on from where the picks were written: it has them, the draft is done
  if (writtenFrom !== null && address !== writtenFrom) {
    setWrittenFrom(null);
    setDraft(null);
  }
  const filters = draft ?? filtersFrom(params);

  const write = (next: Filters) => {
    setParams(paramsOf(next), { replace: true });
  };

  const setFilters = (next: Filters) => {
    if (onPopupStep()) {
      pending.current = next;
      // A sheet open again: its draft waits for its own settle, whatever the address does meanwhile
      setWrittenFrom(null);
      setDraft(next);
      return;
    }
    write(next);
  };

  /** The sheet the picks were made in is closing: they go into the address once its step is gone. */
  const settle = () => {
    // The address doesn't change while a sheet is open: its picks wait in the draft
    const from = address;
    afterPopupsClose(() => {
      const next = pending.current;
      pending.current = null;
      if (next && paramsOf(next).toString() !== from) {
        setWrittenFrom(from);
        write(next);
        return;
      }
      // Nothing to write (no picks, or back as they were): the address already shows them
      setDraft(null);
    });
  };

  return { filters, setFilters, settle };
}
