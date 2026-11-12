import { useState, type ReactNode } from 'react';
import { WhoContext } from './who';
import type { Person, Who } from './world';

/** Where the lens's choice is kept on the device, like the sidebar's width. */
const WHO_KEY = 'pup.whose';

function readWho(people: Person[]): Who {
  try {
    const kept = localStorage.getItem(WHO_KEY);
    return kept === 'family' || people.some((person) => person.id === kept) ? (kept ?? 'me') : 'me';
  } catch {
    return 'me';
  }
}

/** Whose money the lens shows (F-024's final prototype): one choice for the whole app, kept on the device. */
export function WhoProvider({ people, children }: { people: Person[]; children: ReactNode }) {
  const [who, setWho] = useState<Who>(() => readWho(people));
  const pick = (next: Who) => {
    setWho(next);
    try {
      if (next === 'me') localStorage.removeItem(WHO_KEY);
      else localStorage.setItem(WHO_KEY, next);
    } catch {
      // A private window keeps it for the visit only
    }
  };
  return (
    <WhoContext.Provider value={{ people, who, setWho: pick }}>{children}</WhoContext.Provider>
  );
}
