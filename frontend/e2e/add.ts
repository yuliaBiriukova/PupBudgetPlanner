import type { Page } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };

export type AddType = 'Expense' | 'Income' | 'Transfer';

/** The sidebar's Add transaction (the desktop), not a page's own button. */
export const sidebarAdd = (page: Page) =>
  page.getByRole('complementary', { name: en.shell.sidebar }).getByRole('button', {
    name: en.shell.addTransaction,
  });

/** The phone's floating + that opens ⇄ + − (I-030). */
export const phoneAdd = (page: Page) => page.getByRole('button', { name: en.shell.openAdd });

/**
 * Opens the quick-add form from the shell, as a person would: the sidebar's Add transaction on the desktop (on an
 * expense, then switched to the type); on the phone the floating + and the type's round button (I-030).
 */
export async function openAddForm(page: Page, isMobile: boolean, type: AddType = 'Expense') {
  if (isMobile) {
    await phoneAdd(page).click();
    await page.getByRole('button', { name: en.transactions.add[type], exact: true }).click();
  } else {
    await sidebarAdd(page).click();
    if (type !== 'Expense')
      await page
        .getByRole('dialog', { name: en.transactions.add.Expense })
        .getByText(en.transactions.types[type], { exact: true })
        .click();
  }
  return page.getByRole('dialog', { name: en.transactions.add[type] });
}
