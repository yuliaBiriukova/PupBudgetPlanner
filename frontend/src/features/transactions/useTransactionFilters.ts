import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { afterPopupsClose, onPopupStep } from '../../shared/ui/popupHistory';
import { filtersFrom, paramsOf, type Filters } from './filters';

/**
 * The page's filters, kept in its address (`filters.ts`). A change goes into the address at once, replacing it, so
 * Back leaves the page rather than stepping through every pick. While a phone sheet is open its history step is the
 * current entry (I-015): the picks wait in the page until `settle` is called as the sheet closes, then go into the
 * address once the step is gone.
 */
export function useTransactionFilters() {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState<Filters | null>(null);
  const pending = useRef<Filters | null>(null);
  const filters = draft ?? filtersFrom(params);

  const write = (next: Filters) => {
    setParams(paramsOf(next), { replace: true });
  };

  const setFilters = (next: Filters) => {
    if (onPopupStep()) {
      pending.current = next;
      setDraft(next);
      return;
    }
    write(next);
  };

  /** The sheet the picks were made in is closing: they go into the address once its step is gone. */
  const settle = () => {
    afterPopupsClose(() => {
      const next = pending.current;
      pending.current = null;
      if (next) write(next);
      setDraft(null);
    });
  };

  return { filters, setFilters, settle };
}
