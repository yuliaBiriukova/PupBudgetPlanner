/** The groups folded on the Budget page, remembered on this device (owner's review of PR #115); all open at first. */
const FOLDED_KEY = 'pup.budget.folded';

export function readFolded(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(FOLDED_KEY) ?? '[]');
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function writeFolded(folded: readonly string[]) {
  try {
    localStorage.setItem(FOLDED_KEY, JSON.stringify(folded));
  } catch {
    // Private windows may refuse storage: the groups are folded for this visit only
  }
}
