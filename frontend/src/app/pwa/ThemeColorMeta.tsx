import { useComputedColorScheme } from '@mantine/core';
import { useEffect } from 'react';

/**
 * The browser's bars and the installed app's status bar in the page's colour (F-025). index.html sets them from the
 * system's light or dark for the first paint; this follows the scheme picked in the app. Draws nothing itself.
 */
export function ThemeColorMeta() {
  const scheme = useComputedColorScheme('light');

  useEffect(() => {
    const page = getComputedStyle(document.body).backgroundColor;
    if (!page) return;
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute('content', page);
    });
  }, [scheme]);

  return null;
}
