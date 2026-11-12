import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { currentUserQuery } from '../auth/authApi';
import { familyQuery } from './familyApi';
import { inLensOrder, ME, whoseOf, WhoseMoneyContext, type Who } from './whose';

/** Where the lens's choice is kept on the device, like the sidebar's width (F-024, open point 8). */
export const WHO_KEY = 'pup.whose';

function readKept(): Who {
  try {
    return localStorage.getItem(WHO_KEY) ?? ME;
  } catch {
    return ME;
  }
}

function keep(who: Who) {
  try {
    if (who === ME) localStorage.removeItem(WHO_KEY);
    else localStorage.setItem(WHO_KEY, who);
  } catch {
    // A private window keeps it for the visit only
  }
}

/**
 * Whose money the Transactions, Accounts and Reports pages show (F-024): one choice for the whole app, kept on the
 * device; the app starts on your own when nothing is kept. Without a family, or once you leave it, it is your own.
 */
export function WhoseProvider({ children }: { children: ReactNode }) {
  const family = useQuery(familyQuery);
  const user = useQuery(currentUserQuery);
  const [who, setWho] = useState<Who>(readKept);
  const [, setParams] = useSearchParams();
  const { pathname } = useLocation();

  const members = family.data?.members;
  const people = useMemo(() => (members ? inLensOrder(members) : []), [members]);

  const pick = (next: Who) => {
    setWho(next);
    keep(next);
    // Someone else's accounts and categories aren't yours: the Transactions page keeps only its period and type
    if (pathname.startsWith('/transactions')) {
      setParams(
        (params) => {
          params.delete('account');
          params.delete('category');
          return params;
        },
        { replace: true },
      );
    }
  };

  const whose = whoseOf(who, family.isPending ? null : people, user.data?.id, pick);
  // A kept choice that isn't in the family any more (left, removed): your own from now on
  if (family.isSuccess && whose.who !== who) {
    setWho(whose.who);
    keep(whose.who);
  }

  return <WhoseMoneyContext.Provider value={whose}>{children}</WhoseMoneyContext.Provider>;
}
