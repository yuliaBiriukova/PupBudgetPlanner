import { expect, test, type Page } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };

const SECTIONS = [
  'accounts',
  'reports',
  'categories',
  'family',
  'settings',
  'transactions',
] as const;
type SectionId = (typeof SECTIONS)[number];
const IN_MORE: readonly SectionId[] = ['categories', 'family', 'settings'];

/** Opens a section the way a person would: the sidebar on desktop; the tab bar or More on the phone. */
async function openSection(page: Page, id: SectionId, isMobile: boolean) {
  const name = en.nav[id];
  if (isMobile && IN_MORE.includes(id)) {
    await page.getByRole('button', { name: en.nav.more }).click();
    await page.getByRole('dialog', { name: en.nav.more }).getByRole('link', { name }).click();
  } else {
    await page.getByRole('navigation', { name: en.nav.main }).getByRole('link', { name }).click();
  }
}

test('navigates between all sections', async ({ page, isMobile }) => {
  await page.goto('/transactions');

  for (const id of SECTIONS) {
    await openSection(page, id, isMobile);

    await expect(page).toHaveURL(new RegExp(`/${id}$`));
    await expect(page.getByRole('heading', { level: 1, name: en.nav[id] })).toBeVisible();
  }
});

test('adding a transaction is one tap away on every page', async ({ page, isMobile }) => {
  await page.goto('/transactions');

  for (const id of SECTIONS) {
    await openSection(page, id, isMobile);
    await page.getByRole('button', { name: en.shell.addTransaction }).click();

    const dialog = page.getByRole('dialog', { name: en.shell.addTransaction });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
});

test('on the phone, More and Add are sheets at the bottom, as tall as their content', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Sheets are the phone layout; the desktop uses the sidebar and a dialog');
  await page.goto('/transactions');
  const screenHeight = page.viewportSize()?.height ?? 0;

  for (const [button, sheet] of [
    [en.nav.more, en.nav.more],
    [en.shell.addTransaction, en.shell.addTransaction],
  ]) {
    await page.getByRole('button', { name: button }).click();
    const dialog = page.getByRole('dialog', { name: sheet });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCSS('border-radius', '24px 24px 0px 0px');
    await expect(async () => {
      const box = await dialog.boundingBox();
      expect(box && Math.round(box.y + box.height)).toBe(screenHeight);
      expect(box?.height ?? screenHeight).toBeLessThan(screenHeight / 2);
    }).toPass();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
});

test('the desktop sidebar collapses to a rail and expands from the logo', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The sidebar is a desktop layout');
  await page.goto('/transactions');
  const handle = page.getByRole('separator', { name: en.shell.resizeSidebar });

  await page.getByRole('button', { name: en.shell.collapseSidebar }).click();
  await expect(handle).toHaveAttribute('aria-valuetext', en.shell.collapsed);
  await expect(page.locator('aside')).toHaveCSS('width', '72px');
  // In the rail only the icons are left: each keeps its full size, centred on the rail
  const icons = await page
    .locator('aside nav svg')
    .or(page.getByRole('button', { name: en.shell.addTransaction }).locator('svg'))
    .all();
  expect(icons).toHaveLength(7);
  for (const icon of icons) {
    const box = await icon.boundingBox();
    expect(
      box && { width: Math.round(box.width), centre: Math.round(box.x + box.width / 2) },
    ).toEqual({
      width: 20,
      centre: 36,
    });
  }

  await page.getByRole('button', { name: en.shell.expandSidebar }).click();
  await expect(handle).not.toHaveAttribute('aria-valuetext', en.shell.collapsed);
  await expect(page.locator('aside')).toHaveCSS('width', '248px');
});

test('the light and dark mode switch works', async ({ page }) => {
  await page.goto('/transactions');
  const html = page.locator('html');
  const before = await html.getAttribute('data-mantine-color-scheme');
  const switchTo = before === 'dark' ? en.colorScheme.switchToLight : en.colorScheme.switchToDark;

  await page.getByRole('button', { name: switchTo }).first().click();

  await expect(html).toHaveAttribute(
    'data-mantine-color-scheme',
    before === 'dark' ? 'light' : 'dark',
  );
});
