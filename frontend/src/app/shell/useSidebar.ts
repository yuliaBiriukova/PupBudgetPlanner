import { useLocalStorage, useMediaQuery } from '@mantine/hooks';
import { useCallback, useState } from 'react';

/** Sidebar sizes in px. Below `snap` a drag collapses it to the rail; `min` grows to fit the app name. */
export const SIDEBAR = { rail: 72, min: 208, max: 320, default: 248, snap: 150, step: 16 } as const;

export interface SidebarPrefs {
  width: number;
  collapsed: boolean;
}

const STORAGE_KEY = 'pup.sidebar';

/** Where a drag to `requested` px ends: the rail when narrower than the snap point, otherwise clamped. */
export function resolveDrag(requested: number, minWidth: number, lastWidth: number): SidebarPrefs {
  if (requested < SIDEBAR.snap) return { width: lastWidth, collapsed: true };
  return {
    width: Math.round(Math.min(SIDEBAR.max, Math.max(minWidth, requested))),
    collapsed: false,
  };
}

/** One keyboard step on the resize handle: ← narrows (and collapses at the minimum), → widens or expands. */
export function resolveStep(
  prefs: SidebarPrefs,
  direction: 'narrower' | 'wider',
  minWidth: number,
): SidebarPrefs {
  if (direction === 'wider') {
    return prefs.collapsed
      ? { ...prefs, collapsed: false }
      : resolveDrag(prefs.width + SIDEBAR.step, minWidth, prefs.width);
  }
  if (prefs.collapsed || prefs.width - SIDEBAR.step < minWidth)
    return { ...prefs, collapsed: true };
  return resolveDrag(prefs.width - SIDEBAR.step, minWidth, prefs.width);
}

/**
 * The desktop sidebar's state. Collapsed by default below 1024 px; once the person collapses, expands or
 * resizes it, the choice is remembered. The width never goes below `minWidth`, measured from the head row.
 */
export function useSidebar() {
  const narrow = useMediaQuery('(max-width: 63.99em)', false, { getInitialValueInEffect: false });
  const [saved, setSaved] = useLocalStorage<SidebarPrefs | null>({
    key: STORAGE_KEY,
    defaultValue: null,
    getInitialValueInEffect: false,
  });
  const [minWidth, setMinWidthState] = useState<number>(SIDEBAR.min);
  const setMinWidth = useCallback((width: number) => {
    setMinWidthState(Math.min(SIDEBAR.max, Math.max(SIDEBAR.min, Math.ceil(width))));
  }, []);
  const [resizing, setResizing] = useState(false);

  const prefs: SidebarPrefs = {
    width: Math.max(minWidth, saved?.width ?? SIDEBAR.default),
    collapsed: saved?.collapsed ?? narrow,
  };

  return {
    ...prefs,
    /** The grid column width: the rail when collapsed. */
    columnWidth: prefs.collapsed ? SIDEBAR.rail : prefs.width,
    minWidth,
    resizing,
    setResizing,
    setMinWidth,
    toggle: () => {
      setSaved({ ...prefs, collapsed: !prefs.collapsed });
    },
    dragTo: (requested: number) => {
      setSaved(resolveDrag(requested, minWidth, prefs.width));
    },
    step: (direction: 'narrower' | 'wider') => {
      setSaved(resolveStep(prefs, direction, minWidth));
    },
  };
}

export type SidebarState = ReturnType<typeof useSidebar>;
