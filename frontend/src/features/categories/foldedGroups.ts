/** The groups folded on the phone and tablet, remembered on this device (F-015). */
const FOLDED_KEY = 'pup.categories.folded';

export function readFolded(): Set<string> {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(FOLDED_KEY) ?? '[]');
    return new Set(
      Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [],
    );
  } catch {
    return new Set();
  }
}

export function writeFolded(folded: ReadonlySet<string>) {
  try {
    localStorage.setItem(FOLDED_KEY, JSON.stringify([...folded]));
  } catch {
    // Private windows may refuse storage; every group then starts open
  }
}
