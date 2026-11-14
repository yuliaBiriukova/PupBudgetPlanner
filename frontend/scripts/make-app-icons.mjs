// Draws the installable app's icons (F-025) from the logo in public/favicon.svg: the coin stack on the sky.
// Run it again only when the logo changes: `node scripts/make-app-icons.mjs` in frontend/ (it uses Playwright's
// Chromium, already installed for the E2E tests). It writes:
// - pwa-192.png, pwa-512.png: the sky circle with transparent corners, as in the tab and the sidebar ("any");
// - pwa-maskable-512.png: the sky filling the square, the coins inside the middle 80 % that every shape keeps
//   (Android cuts it to a circle, a squircle or a rounded square; owner, 2026-11-14).
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const SKY = '#8ec1ec';

// The coin stack's strokes, from favicon.svg (Tabler "coins" on a 24 unit grid)
const favicon = await readFile(`${PUBLIC}favicon.svg`, 'utf8');
const strokes = favicon.match(/<g transform="translate\(4 4\)"[^>]*>([\s\S]*?)<\/g>/)?.[1];
const style = favicon.match(/<g transform="translate\(4 4\)"([^>]*)>/)?.[1];
if (!strokes || !style) throw new Error('The coin stack was not found in favicon.svg');

/** The icon at `size` px; `iconShare` is the part of the side the 24 unit grid takes. */
function svg(size, { round, iconShare }) {
  const box = size * iconShare;
  const offset = (size - box) / 2;
  const scale = box / 24;
  const sky = round
    ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${SKY}"/>`
    : `<rect width="${size}" height="${size}" fill="${SKY}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${sky}
    <g transform="translate(${offset} ${offset}) scale(${scale})"${style}>${strokes}</g>
  </svg>`;
}

const ICONS = [
  // As favicon.svg: the grid takes 24 of the circle's 32
  { file: 'pwa-192.png', size: 192, round: true, iconShare: 0.75 },
  { file: 'pwa-512.png', size: 512, round: true, iconShare: 0.75 },
  // The grid in the middle 62.5 %: the coins themselves stay well inside the safe 80 %
  { file: 'pwa-maskable-512.png', size: 512, round: false, iconShare: 0.625 },
];

const browser = await chromium.launch();
for (const icon of ICONS) {
  const page = await browser.newPage({ viewport: { width: icon.size, height: icon.size } });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg(icon.size, icon)}</body></html>`,
  );
  await page.locator('svg').screenshot({ path: `${PUBLIC}${icon.file}`, omitBackground: true });
  await page.close();
  console.log(`public/${icon.file}`);
}
await browser.close();
