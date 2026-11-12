import { createContext, useContext } from 'react';
import type { FamilyMember } from './familyApi';

/**
 * Whose money the Transactions, Accounts and Reports pages show (F-024): `me`, a family member's id, or `family`
 * (everyone together). One choice for the whole app, picked in the shell's lens and kept on the device.
 */
export type Who = string;

export const ME: Who = 'me';
export const FAMILY: Who = 'family';

/** The `i18next` context of the pages' words that say "your": someone else's money, or the family's. */
export type WhoseContext = 'their' | 'family' | undefined;

export interface Whose {
  /** The lens's choice; always `me` without a family. */
  who: Who;
  setWho: (who: Who) => void;
  /** Everyone in the family, you first, then the others in the order they joined; empty without a family. */
  people: FamilyMember[];
  /** The lens shows: you are in a family with someone else in it. */
  lens: boolean;
  /** Someone else's money (one member's): only to look at. */
  theirs: boolean;
  /** The member whose money it is, when it is someone else's. */
  person?: FamilyMember;
  /** Whether a line or a card of `ownerId`'s is yours, so it opens and can be changed. */
  isMine: (ownerId: string) => boolean;
  /** The member's name, for a line or a card in the family's money that isn't yours. */
  nameOf: (ownerId: string) => string | undefined;
  /** For the pages' words that say "your": `t(key, { context, name })`. */
  context: WhoseContext;
}

export const NOBODY_ELSE: Whose = {
  who: ME,
  setWho: () => undefined,
  people: [],
  lens: false,
  theirs: false,
  isMine: () => true,
  nameOf: () => undefined,
  context: undefined,
};

export const WhoseMoneyContext = createContext<Whose>(NOBODY_ELSE);

/** Whose money the page shows; outside the app's shell (tests, stories) always yours. */
export function useWhose(): Whose {
  return useContext(WhoseMoneyContext);
}

/** The `who` the API is asked for: none for your own, so its requests and cached data stay as they were. */
export function whoParam(who: Who): string | undefined {
  return who === ME ? undefined : who;
}

/** Everyone in the family in the lens's order: you, then the others by when they joined. */
export function inLensOrder(members: readonly FamilyMember[]): FamilyMember[] {
  return [...members].sort(
    (a, b) => Number(b.isYou) - Number(a.isYou) || a.joinedAt.localeCompare(b.joinedAt),
  );
}

/**
 * What the pages need to know about `who` among `people` (see `Whose`). `people` is null while the family is
 * loading: the kept choice holds meanwhile, so a page doesn't load your money first, but the lens and the words wait
 * for the names. A choice that isn't in the family (any more) is your own.
 */
export function whoseOf(
  who: Who,
  people: FamilyMember[] | null,
  myId: string | undefined,
  setWho: (who: Who) => void,
): Whose {
  const isMine = (picked: Who) => (ownerId: string) => picked === ME || ownerId === myId;
  if (people === null) {
    return {
      ...NOBODY_ELSE,
      who,
      setWho,
      theirs: who !== ME && who !== FAMILY,
      isMine: isMine(who),
    };
  }
  if (!people.some((member) => !member.isYou)) return NOBODY_ELSE;
  const person = people.find((member) => member.id === who && !member.isYou);
  const picked = who === FAMILY || person ? who : ME;
  return {
    who: picked,
    setWho,
    people,
    lens: true,
    theirs: !!person,
    person,
    isMine: isMine(picked),
    nameOf: (ownerId) => people.find((member) => member.id === ownerId)?.displayName,
    context: person ? 'their' : picked === FAMILY ? 'family' : undefined,
  };
}

/** A person's first letter, as the People and Family pages show them. */
export function initialOf(name: string): string {
  return name.trim().slice(0, 1).toUpperCase();
}
