// Design check for prototypes, run with Playwright and axe-core: Storybook prototype stories (I-021) and the older
// HTML prototypes (docs/changes/**/prototypes/*.html).
// Usage (in frontend/, Storybook running): npm run design:check -- "http://localhost:6006/iframe.html?id=<story-id>"
// or npm run design:check -- ../docs/changes/features/F-xxx-name/prototypes/variant-1.html
// Options: --out <folder> (default test-results/design-check). Exit code 1 when issues are found.
// Pages of the running app are checked too: pass their http(s) addresses, and --storage <file> with a Playwright
// storage state for pages that need a signed-in person.
// A story is opened once per color scheme with the toolbar's colorScheme global, and named after its id.
//
// A prototype gets the full check when it exposes these optional globals: go(pageId) with PAGES [{ id }],
// state.schemePref + applyScheme() for light/dark, setView(name), coldStart() / endColdStart() for the
// waking-up state, setNavCollapsed(bool | null), setLogo(name) with LOGOS; a menu button with
// data-action="more" or "drawer" and an Add button with data-action="add" are opened too. A mix-and-match
// prototype exposes BLOCKS ({ id: { options: { key: … } } }), picks, setBlock(id, key) and resetBlocks(); every
// option is then checked with the other blocks at their defaults (what resetBlocks() sets).
// Other HTML files are checked as they are, in both color schemes.
/* global go, PAGES, state, applyScheme, setView, setNavCollapsed, setLogo, LOGOS, coldStart, endColdStart, BLOCKS, picks, setBlock, resetBlocks, axe */
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const OUT = resolve(outIndex >= 0 ? args.splice(outIndex, 2)[1] : 'test-results/design-check');
const storageIndex = args.indexOf('--storage');
const STORAGE = storageIndex >= 0 ? resolve(args.splice(storageIndex, 2)[1]) : undefined;
const isUrl = (f) => /^https?:\/\//.test(f);
const FILES = args.map((f) => (isUrl(f) ? f : resolve(f)));
// A Storybook story's own page: Mantine follows the toolbar's global there, not the system's scheme
const isStory = (f) => isUrl(f) && new URL(f).pathname.endsWith('/iframe.html');
const storyIn = (f, scheme) => {
  const url = new URL(f);
  url.searchParams.set('globals', `colorScheme:${scheme}`);
  return url.href;
};
const nameOf = (f) =>
  isStory(f)
    ? (new URL(f).searchParams.get('id') ?? 'story')
    : isUrl(f)
      ? new URL(f).pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home'
      : basename(f, '.html');
if (FILES.length === 0) {
  console.error(
    'Usage: npm run design:check -- <http://localhost:6006/iframe.html?id=story | prototype.html | http://localhost:5173/page> [more] [--out folder] [--storage state.json]',
  );
  process.exit(2);
}
mkdirSync(`${OUT}/shots`, { recursive: true });

const VIEWPORTS = [
  { name: '360', width: 360, height: 740, mobile: true },
  { name: '375', width: 375, height: 812, mobile: true },
  { name: '768', width: 768, height: 1024, mobile: false },
  { name: '1024', width: 1024, height: 768, mobile: false },
  { name: '1440', width: 1440, height: 900, mobile: false },
];
const SCREENSHOT_VIEWPORTS = ['375', '1440'];
const SCHEMES = ['light', 'dark'];

const issues = new Map();
function report(file, check, target, detail, where) {
  const key = `${file}|${check}|${target}|${detail}`;
  if (!issues.has(key)) issues.set(key, { file, check, target, detail, where: new Set() });
  issues.get(key).where.add(where);
}

// Runs in the page: layout problems in the current state.
function inspect({ mobile }) {
  const root = document.getElementById('app') ?? document.body;
  const rootRect = root.getBoundingClientRect();
  const out = [];
  const desc = (el) => {
    const label =
      el.getAttribute('aria-label') ||
      el.dataset.nav ||
      el.dataset.action ||
      (el.textContent || '').trim().slice(0, 24);
    const classes = el.classList.length ? '.' + [...el.classList].join('.') : '';
    return `${el.tagName.toLowerCase()}${classes}${label ? ` "${label}"` : ''}`;
  };
  const visible = (el) => {
    if (el.closest('[hidden], .proto-bar, .proto-notes')) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const visuallyHidden = (el) => {
    const s = getComputedStyle(el);
    // clip-path, or the older clip that screen-reader-only text (Mantine's VisuallyHidden) uses
    return (s.clipPath !== 'none' && s.clipPath !== '') || (s.clip !== 'auto' && s.clip !== '');
  };

  // Content inside a horizontal scroll container (a wide table, a row of cards) may extend past the screen
  const inSideScroller = (el) => {
    for (let p = el.parentElement; p && p !== root; p = p.parentElement) {
      if (p.matches('[data-scroll]')) return false;
      const x = getComputedStyle(p).overflowX;
      if (x === 'auto' || x === 'scroll') return true;
    }
    return false;
  };

  // Horizontal overflow
  for (const el of root.querySelectorAll('.content, [data-scroll]')) {
    if (el.scrollWidth > el.clientWidth + 1)
      out.push(['overflow', desc(el), `scrollWidth ${el.scrollWidth} > ${el.clientWidth}`]);
  }
  for (const el of root.querySelectorAll('*')) {
    if (!visible(el) || inSideScroller(el) || visuallyHidden(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > rootRect.right + 1 || r.left < rootRect.left - 1)
      out.push(['outside-screen', desc(el), `x ${Math.round(r.left)}–${Math.round(r.right)}`]);
  }

  // Touch targets: ≥ 44 × 44 on phones (DESIGN_RULES §4), ≥ 24 × 24 elsewhere (WCAG 2.5.8)
  const min = mobile ? 44 : 24;
  for (const el of root.querySelectorAll('a, button, input, select, textarea, [role="button"]')) {
    if (!visible(el) || visuallyHidden(el)) continue;
    // A check box or radio inside its label is clicked anywhere on the label
    const label = el.matches('input') ? el.closest('label') : null;
    const r = (label ?? el).getBoundingClientRect();
    if (r.width < min - 0.5 || r.height < min - 0.5)
      out.push([
        'touch-target',
        desc(el),
        `${Math.round(r.width)}×${Math.round(r.height)} < ${min}`,
      ]);
  }

  // Icon scale 16 / 20 / 24 (DESIGN_RULES §3)
  for (const svg of root.querySelectorAll('svg.ic')) {
    if (!visible(svg)) continue;
    const w = Math.round(svg.getBoundingClientRect().width);
    if (![16, 20, 24].includes(w))
      out.push(['icon-size', desc(svg.parentElement), `${w}px (use 16, 20 or 24)`]);
  }

  // Text cut off without an ellipsis
  for (const el of root.querySelectorAll(
    'b, span, small, p, h1, h2, h3, a, button, label, td, th',
  )) {
    if (!visible(el) || inSideScroller(el) || el.children.length || visuallyHidden(el)) continue;
    const s = getComputedStyle(el);
    if (s.textOverflow === 'ellipsis' || s.overflow === 'visible') continue;
    if (el.scrollWidth > el.clientWidth + 1)
      out.push(['clipped-text', desc(el), `${el.scrollWidth} > ${el.clientWidth}`]);
  }

  // Floating elements (absolute / fixed, and navigation bars) covering each other.
  // Modal layers (overlays, drawers) cover the whole screen on purpose, so they and their content are skipped.
  const modal = (el) => {
    const r = el.getBoundingClientRect();
    return r.width >= rootRect.width * 0.9 && r.height >= rootRect.height * 0.9;
  };
  const floats = [...root.querySelectorAll('*')].filter((el) => {
    if (!visible(el) || visuallyHidden(el) || el.closest('.overlay')) return false;
    for (let p = el; p && p !== root; p = p.parentElement) {
      const pos = getComputedStyle(p).position;
      if ((pos === 'absolute' || pos === 'fixed') && modal(p)) return false;
    }
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return false;
    const p = getComputedStyle(el).position;
    return p === 'fixed' || p === 'absolute' || (el.tagName === 'NAV' && r.width > r.height);
  });
  for (let i = 0; i < floats.length; i++) {
    for (let j = i + 1; j < floats.length; j++) {
      if (floats[i].contains(floats[j]) || floats[j].contains(floats[i])) continue;
      const a = floats[i].getBoundingClientRect();
      const b = floats[j].getBoundingClientRect();
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 1 && oy > 1)
        out.push([
          'overlap',
          `${desc(floats[i])} × ${desc(floats[j])}`,
          `${Math.round(ox)}×${Math.round(oy)} px`,
        ]);
    }
  }
  return out;
}

// Runs in the page: at the end of the scroll, does a floating button cover the last row?
function lastRowCovered() {
  const scroller = document.querySelector('[data-scroll]');
  if (!scroller) return false;
  scroller.scrollTop = scroller.scrollHeight;
  const fabs = [...document.querySelectorAll('button, a')].filter((el) => {
    const s = getComputedStyle(el);
    return (
      (s.position === 'absolute' || s.position === 'fixed') && el.getBoundingClientRect().width > 0
    );
  });
  const rows = [...scroller.querySelectorAll('.tx, .acc, .member, .field, .btn, li, tr')];
  const last = rows.at(-1);
  const covered =
    last &&
    fabs.some((fab) => {
      const a = fab.getBoundingClientRect();
      const b = last.getBoundingClientRect();
      return (
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0 &&
        Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0
      );
    });
  scroller.scrollTop = 0;
  return Boolean(covered);
}

async function runAxe(page) {
  return page.evaluate(async () => {
    const result = await axe.run(document.getElementById('app') ?? document.body, {
      resultTypes: ['violations'],
      rules: { region: { enabled: false } },
    });
    return result.violations.flatMap((v) =>
      v.nodes.map((n) => [`axe:${v.id}`, n.target.join(' '), n.any[0]?.message ?? v.help]),
    );
  });
}

// The kit's hooks are function declarations, so they live on globalThis
const has = (page, name) => page.evaluate((n) => typeof globalThis[n] === 'function', name);

const browser = await chromium.launch();
const consoleErrors = [];
const shots = [];
for (const file of FILES) {
  const name = nameOf(file);
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.mobile,
      reducedMotion: 'reduce',
      storageState: STORAGE,
    });
    const page = await context.newPage();
    page.on(
      'console',
      (m) => m.type() === 'error' && consoleErrors.push(`${name} ${vp.name}: ${m.text()}`),
    );
    page.on('pageerror', (e) => consoleErrors.push(`${name} ${vp.name}: ${e.message}`));
    const prepare = async () => {
      await page.addScriptTag({ content: AXE });
      if (await has(page, 'setView')) {
        // Fill the window with the app; a phone frame is only a preview aid
        await page.evaluate(() => setView('desktop'));
        await page.addStyleTag({
          content:
            '.stage{padding:0!important}.stage .frame{border-radius:0!important;box-shadow:none!important}.proto-panel{display:none!important}',
        });
      }
    };
    await page.goto(isUrl(file) ? file : pathToFileURL(file).href);
    if (isUrl(file)) await page.waitForLoadState('networkidle');
    await prepare();
    const kit = await has(page, 'go');
    const pages = kit ? await page.evaluate(() => PAGES.map((p) => p.id)) : [''];
    const modes =
      !vp.mobile && (await has(page, 'setNavCollapsed')) ? ['expanded', 'collapsed'] : [''];

    const check = async (where) => {
      for (const [c, t, d] of await page.evaluate(inspect, { mobile: vp.mobile }))
        report(name, c, t, d, where);
    };
    const shot = async (...parts) => {
      const id = [name, vp.name, ...parts].filter(Boolean).join('-');
      await page.screenshot({ path: `${OUT}/shots/${id}.png` });
      shots.push(id);
    };

    for (const mode of modes) {
      if (mode) await page.evaluate((c) => setNavCollapsed(c), mode === 'collapsed');
      for (const scheme of SCHEMES) {
        if (kit)
          await page.evaluate((s) => {
            state.schemePref = s;
            applyScheme();
          }, scheme);
        else if (isStory(file)) {
          await page.goto(storyIn(file, scheme));
          await page.waitForLoadState('networkidle');
          await prepare();
        } else await page.emulateMedia({ colorScheme: scheme });
        for (const p of pages) {
          if (p) await page.evaluate((id) => go(id), p);
          const where = [`${vp.name}px`, mode, scheme, p].filter(Boolean).join(' ');
          await check(where);
          if (await page.evaluate(lastRowCovered))
            report(name, 'fab-covers-content', 'last row', 'a floating button covers it', where);
          for (const [c, t, d] of await runAxe(page)) report(name, c, t, d, where);
        }
        if (!kit) {
          if (SCREENSHOT_VIEWPORTS.includes(vp.name)) await shot(mode, scheme);
          continue;
        }
        await page.evaluate((id) => go(id), pages[0]);
        if (SCREENSHOT_VIEWPORTS.includes(vp.name)) await shot(mode, scheme);
        const state0 = `${vp.name}px ${mode} ${scheme}`.replace('  ', ' ');

        // Menu (bottom sheet / drawer), if the layout has one at this size
        const menu = await page.evaluate(() => {
          const b = [
            ...document.querySelectorAll('[data-action="more"], [data-action="drawer"]'),
          ].find((x) => x.getBoundingClientRect().width > 0);
          b?.click();
          return Boolean(b);
        });
        if (menu) {
          await check(`${state0} menu open`);
          if (vp.name === '375' && scheme === 'light') await shot('menu');
          await page.keyboard.press('Escape');
        }

        // Add sheet
        const add = await page.evaluate(() => {
          const b = [...document.querySelectorAll('[data-action="add"]')].find(
            (x) => x.getBoundingClientRect().width > 0,
          );
          b?.click();
          return Boolean(b);
        });
        if (add) {
          await check(`${state0} add open`);
          const fits = await page.evaluate(() => {
            const s = document.querySelector('#add .sheet')?.getBoundingClientRect();
            const a = (document.getElementById('app') ?? document.body).getBoundingClientRect();
            return !s || (s.top >= a.top && s.bottom <= a.bottom + 1);
          });
          if (!fits) report(name, 'sheet-fit', 'Add sheet', 'taller than the screen', state0);
          if (vp.name === '375' && scheme === 'light') await shot('add');
          await page.keyboard.press('Escape');
        }

        // Waking-up state
        if (await has(page, 'coldStart')) {
          await page.evaluate(() => coldStart());
          await check(`${state0} waking`);
          if (SCREENSHOT_VIEWPORTS.includes(vp.name)) await shot(mode, scheme, 'waking');
          if (await has(page, 'endColdStart')) await page.evaluate(() => endColdStart());
          else {
            await page.reload();
            await prepare();
            if (mode) await page.evaluate((c) => setNavCollapsed(c), mode === 'collapsed');
          }
        }
      }
    }

    // Logo options
    if (await has(page, 'setLogo')) {
      if (modes[0]) await page.evaluate(() => setNavCollapsed(null));
      for (const logo of await page.evaluate(() => Object.keys(LOGOS))) {
        await page.evaluate((l) => setLogo(l), logo);
        await check(`${vp.name}px logo ${logo}`);
      }
    }

    // Block options of a mix-and-match prototype: each option with the other blocks at their defaults
    if (kit && (await has(page, 'setBlock'))) {
      const blocks = await page.evaluate(() => {
        resetBlocks();
        return Object.entries(BLOCKS).map(([id, b]) => [id, Object.keys(b.options), picks[id]]);
      });
      for (const [id, options, byDefault] of blocks) {
        // The default option was checked above
        for (const option of options.filter((o) => o !== byDefault)) {
          await page.evaluate(
            ([b, o]) => {
              resetBlocks();
              setBlock(b, o);
            },
            [id, option],
          );
          await page.evaluate((p) => go(p), pages[0]);
          for (const mode of modes) {
            if (mode) await page.evaluate((c) => setNavCollapsed(c), mode === 'collapsed');
            for (const scheme of SCHEMES) {
              await page.evaluate((s) => {
                state.schemePref = s;
                applyScheme();
              }, scheme);
              const where = [`${vp.name}px`, mode, scheme, `${id}=${option}`]
                .filter(Boolean)
                .join(' ');
              await check(where);
              if (await page.evaluate(lastRowCovered))
                report(
                  name,
                  'fab-covers-content',
                  'last row',
                  'a floating button covers it',
                  where,
                );
              for (const [c, t, d] of await runAxe(page)) report(name, c, t, d, where);
            }
          }
          // States the option may change: menu, Add sheet, waking up (light, the last nav mode)
          await page.evaluate(() => {
            state.schemePref = 'light';
            applyScheme();
          });
          const state0 = [`${vp.name}px`, `${id}=${option}`].join(' ');
          for (const action of ['more', 'add']) {
            const opened = await page.evaluate((a) => {
              const b = [...document.querySelectorAll(`[data-action="${a}"]`)].find(
                (x) => x.getBoundingClientRect().width > 0,
              );
              b?.click();
              return Boolean(b);
            }, action);
            if (opened) {
              await check(`${state0} ${action} open`);
              await page.keyboard.press('Escape');
            }
          }
          if (await has(page, 'coldStart')) {
            await page.evaluate(() => coldStart());
            await check(`${state0} waking`);
            for (const [c, t, d] of await runAxe(page)) report(name, c, t, d, `${state0} waking`);
            if (id === 'wake' && SCREENSHOT_VIEWPORTS.includes(vp.name)) await shot(id, option);
            await page.evaluate(() => endColdStart());
          }
          if (modes[0]) await page.evaluate(() => setNavCollapsed(false));
          if (id !== 'wake' && SCREENSHOT_VIEWPORTS.includes(vp.name)) await shot(id, option);
        }
      }
      await page.evaluate(() => resetBlocks());
      if (modes[0]) await page.evaluate(() => setNavCollapsed(null));
    }

    // Keyboard: visible focus ring on the first tab stops
    if (SCREENSHOT_VIEWPORTS.includes(vp.name)) {
      await page.evaluate(() =>
        (document.getElementById('app') ?? document.body).querySelector('a, button')?.focus(),
      );
      for (let i = 0; i < 14; i++) {
        const f = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body || el.closest('.proto-bar')) return null;
          const s = getComputedStyle(el);
          const label = el.getAttribute('aria-label') ?? el.textContent.trim().slice(0, 20);
          // A line drawn by ::after (a resize handle's) counts too
          const after = getComputedStyle(el, '::after');
          const line =
            after.content !== 'none' &&
            !['transparent', 'rgba(0, 0, 0, 0)'].includes(after.backgroundColor);
          // A field's wrapper (a search box with its icon) may draw the ring with :focus-within
          const ring = (x) => {
            const c = getComputedStyle(x);
            return c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0;
          };
          const wrapped =
            el.matches('input, textarea') && el.parentElement && ring(el.parentElement);
          return {
            el: `${el.tagName.toLowerCase()} "${label}"`,
            ok: (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || line || wrapped,
          };
        });
        if (f && !f.ok)
          report(name, 'focus-ring', f.el, 'no visible focus outline', `${vp.name}px keyboard`);
        await page.keyboard.press('Tab');
      }
    }
    await context.close();
  }
}
await browser.close();

// Report: JSON, an HTML page with the screenshots, and a summary on the console
const list = [...issues.values()].map((i) => ({ ...i, where: [...i.where] }));
writeFileSync(
  `${OUT}/report.json`,
  JSON.stringify({ issues: list, consoleErrors, shots }, null, 2),
);
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );
const rows = list
  .map(
    (i) =>
      `<tr><td>${esc(i.file)}</td><td>${esc(i.check)}</td><td>${esc(i.target)}</td><td>${esc(i.detail)}</td><td>${esc(i.where.slice(0, 4).join('; '))}${i.where.length > 4 ? ` +${i.where.length - 4}` : ''}</td></tr>`,
  )
  .join('');
const figures = shots
  .map(
    (s) =>
      `<figure class="${s.includes('1440') ? 'wide' : ''}"><img loading="lazy" src="shots/${s}.png" alt="${s}"><figcaption>${s}</figcaption></figure>`,
  )
  .join('');
writeFileSync(
  `${OUT}/report.html`,
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Design check</title>
<style>:root{--bg:#fff;--fg:#212529;--line:#dee2e6;--card:#f8f9fa}@media (prefers-color-scheme:dark){:root{--bg:#1f1f1f;--fg:#e0e0e0;--line:#424242;--card:#2e2e2e}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,sans-serif}main{max-width:1200px;margin:0 auto;padding:24px 16px}
.t{overflow-x:auto}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid var(--line);padding:6px 10px;text-align:left;vertical-align:top}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;align-items:start}figure{margin:0;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px}
figure.wide{grid-column:span 2}@media (max-width:480px){figure.wide{grid-column:auto}}img{width:100%;display:block}figcaption{font-size:12px;margin-top:4px}</style></head>
<body><main><h1>Design check</h1><p>${list.length} issues, ${consoleErrors.length} console errors · ${FILES.map((f) => esc(nameOf(f))).join(', ')}</p>
${list.length ? `<div class="t"><table><thead><tr><th>File</th><th>Check</th><th>Element</th><th>Detail</th><th>Where</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}
<h2>Screenshots</h2><div class="g">${figures}</div></main></body></html>`,
);
const groups = {};
for (const i of list) (groups[`${i.file} · ${i.check}`] ??= []).push(i);
for (const [key, arr] of Object.entries(groups)) {
  console.log(`\n${key} (${arr.length})`);
  for (const i of arr.slice(0, 10))
    console.log(`  - ${i.target}: ${i.detail}  [${i.where.slice(0, 3).join('; ')}]`);
  if (arr.length > 10) console.log(`  … ${arr.length - 10} more`);
}
console.log(`\n${list.length} issues, ${consoleErrors.length} console errors`);
for (const e of consoleErrors) console.log(`  console: ${e}`);
console.log(`Report: ${OUT}/report.html`);
process.exit(list.length || consoleErrors.length ? 1 : 0);
