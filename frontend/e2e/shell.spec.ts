import { expect, test, type Page } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { openAddForm, phoneAdd, sidebarAdd, type AddType } from './add.ts';

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
    await page.getByRole('button', { name: en.nav.more, exact: true }).click();
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

test('adding a transaction is at hand on every page: the sidebar’s Add, the phone’s + and its three', async ({
  page,
  isMobile,
}) => {
  await page.goto('/transactions');
  const types: readonly AddType[] = ['Expense', 'Income', 'Transfer'];

  for (const [i, id] of SECTIONS.entries()) {
    await openSection(page, id, isMobile);
    // On the phone the + floats in sight on every page (I-030); each page tries one of the three
    if (isMobile) await expect(phoneAdd(page)).toBeInViewport({ ratio: 1 });
    const type = isMobile ? (types[i % types.length] ?? 'Expense') : 'Expense';

    // The quick-add form (F-018) opens on the type: the desktop's on an expense
    const dialog = await openAddForm(page, isMobile, type);
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
});

test('on the phone the + opens ⇄ + − over the dimmed page and folds them; the last row scrolls clear of it', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The floating + is the phone’s; the desktop has the sidebar’s Add');
  await page.goto('/reports');
  await expect(page.getByRole('heading', { level: 1, name: en.nav.reports })).toBeVisible();
  // The + by its place, as its name turns from Add a transaction into Close
  const add = page.locator('button[aria-expanded]').and(
    page.getByRole('button', {
      name: new RegExp(`^(${en.shell.openAdd}|${en.shell.closeAdd})$`),
    }),
  );
  const expense = page.getByRole('button', { name: en.transactions.add.Expense, exact: true });

  // Expense nearest to the +, Transfer at the top; the + turns into ×
  await add.click();
  await expect(add).toHaveAccessibleName(en.shell.closeAdd);
  const tops: number[] = [];
  for (const type of ['Transfer', 'Income', 'Expense'] as const) {
    const box = await page
      .getByRole('button', { name: en.transactions.add[type], exact: true })
      .boundingBox();
    tops.push(box?.y ?? 0);
  }
  const plus = await add.boundingBox();
  const order = [...tops, plus?.y ?? 0];
  expect(order).toEqual([...order].sort((a, b) => a - b));

  // ×, Escape and a tap on the dimmed page fold them
  // Each time open first, so a closed menu means it folded, not that it hadn't opened yet (I-033)
  await add.click();
  await expect(expense).toBeHidden();
  await phoneAdd(page).click();
  await expect(expense).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(expense).toBeHidden();
  await phoneAdd(page).click();
  await expect(expense).toBeVisible();
  await page.mouse.click(40, 200);
  await expect(expense).toBeHidden();
  await expect(page).toHaveURL(/\/reports$/);

  // Back leaves the page with the three open: they add no step to the history (owner, 2026-11-09)
  await openSection(page, 'accounts', isMobile);
  await phoneAdd(page).click();
  await expect(expense).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/reports$/);
  await expect(expense).toBeHidden();

  // At the end of the page its last row is above the + (the page has room under it)
  const main = page.locator('main');
  await main.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const lastBottom = await main.evaluate((element) =>
    Math.max(
      ...Array.from(element.querySelectorAll('*'), (child) => child.getBoundingClientRect().bottom),
    ),
  );
  const plusTop = (await phoneAdd(page).boundingBox())?.y ?? 0;
  expect(lastBottom).toBeLessThanOrEqual(plusTop);
});

test('on the phone, More and Add are sheets at the bottom, each as tall as its content', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Sheets are the phone layout; the desktop uses the sidebar and a dialog');
  await page.goto('/transactions');
  const screenHeight = page.viewportSize()?.height ?? 0;

  for (const [button, sheet] of [
    [en.nav.more, en.nav.more],
    [en.shell.addTransaction, en.transactions.add.Expense],
  ] as const) {
    if (button === en.nav.more) await page.getByRole('button', { name: button }).click();
    else await openAddForm(page, isMobile);
    const dialog = page.getByRole('dialog', { name: sheet });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCSS('border-radius', '24px 24px 0px 0px');
    await expect(async () => {
      const box = await dialog.boundingBox();
      expect(box && Math.round(box.y + box.height)).toBe(screenHeight);
      // Add is no longer a set 90 % of the screen (I-029): this person has no account yet, so it holds only the
      // "Add an account first" message and is as short as More (sheets.spec.ts has the form with its fields)
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
  const icons = await page.locator('aside nav svg').or(sidebarAdd(page).locator('svg')).all();
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

test('the sidebar’s foot is on one line: the initial, the name, the theme button and Sign out (B-022)', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The phone has no sidebar');
  await page.goto('/transactions');
  const signOut = page.getByRole('button', { name: en.shell.signOut });
  await expect(signOut).toBeVisible();

  // The foot holds the initial and the name, and a box with the two buttons
  const middles = await signOut.evaluate((button) => {
    const foot = button.parentElement?.parentElement;
    if (!foot) throw new Error('no foot');
    const middle = (element: Element) => {
      const { top, height } = element.getBoundingClientRect();
      return top + height / 2;
    };
    const [initial, name] = Array.from(foot.children);
    return [initial, name, ...Array.from(foot.querySelectorAll('button'))].map(middle);
  });
  expect(middles).toHaveLength(4);
  for (const middle of middles) expect(Math.abs(middle - middles[0])).toBeLessThanOrEqual(1);
});
