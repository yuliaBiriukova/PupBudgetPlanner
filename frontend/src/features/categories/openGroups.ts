/**
 * The open groups, remembered on this device and shared by both layouts (F-015): the phone and tablet open any of
 * them, the desktop shows the last one opened. The most recently opened group comes last.
 */
const OPEN_KEY = 'pup.categories.open';

/** Null when nothing is stored yet: only the first group is open then. */
export function readOpen(): string[] | null {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(OPEN_KEY) ?? 'null');
    return Array.isArray(stored)
      ? stored.filter((id): id is string => typeof id === 'string')
      : null;
  } catch {
    return null;
  }
}

export function writeOpen(open: readonly string[]) {
  try {
    localStorage.setItem(OPEN_KEY, JSON.stringify(open));
  } catch {
    // Private windows may refuse storage; the page then starts with only the first group open
  }
}

/**
 * The groups to show open: the stored ones that still exist, or only the first group when nothing is stored (or
 * nothing stored belongs to this person, e.g. someone else used this device).
 */
export function openGroups(
  stored: readonly string[] | null,
  groupIds: readonly string[],
): string[] {
  if (stored?.length === 0) return [];
  const known = (stored ?? []).filter((id) => groupIds.includes(id));
  return known.length > 0 ? known : groupIds.slice(0, 1);
}
