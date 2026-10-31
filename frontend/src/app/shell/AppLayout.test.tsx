import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';

describe('app shell on the phone', () => {
  it('opens on Transactions, marked in the tab bar', async () => {
    renderApp('/');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Transactions' }),
    ).toBeInTheDocument();
    const tabs = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(tabs).getByRole('link', { name: 'Transactions' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByRole('complementary', { name: 'Sidebar' })).not.toBeInTheDocument();
  });

  it('switches sections from the tab bar', async () => {
    const user = userEvent.setup();
    renderApp('/transactions');

    await user.click(await screen.findByRole('link', { name: 'Reports' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Reports' })).toBeInTheDocument();
  });

  it('opens Family and Settings from More', async () => {
    const user = userEvent.setup();
    renderApp('/transactions');

    await user.click(await screen.findByRole('button', { name: 'More' }));
    const sheet = await screen.findByRole('dialog', { name: 'More' });
    await user.click(within(sheet).getByRole('link', { name: 'Family' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Family' })).toBeInTheDocument();
  });

  it('opens adding a transaction from the tab bar', async () => {
    const user = userEvent.setup();
    renderApp('/accounts');

    await user.click(await screen.findByRole('button', { name: 'Add transaction' }));

    expect(await screen.findByRole('dialog', { name: 'Add transaction' })).toBeInTheDocument();
  });

  it('switches between light and dark mode', async () => {
    const user = userEvent.setup();
    renderApp('/transactions');

    await user.click(await screen.findByRole('button', { name: 'Switch to dark mode' }));

    expect(await screen.findByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-mantine-color-scheme', 'dark');
  });
});

describe('app shell on the desktop', () => {
  beforeEach(() => {
    setScreenWidth(1280);
  });

  const resizeHandle = () => screen.getByRole('separator', { name: 'Resize sidebar' });

  it('shows every section in the sidebar', async () => {
    renderApp('/settings');

    const sidebar = await screen.findByRole('complementary', { name: 'Sidebar' });
    const nav = within(sidebar).getByRole('navigation', { name: 'Main navigation' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Transactions', 'Accounts', 'Reports', 'Categories', 'Family', 'Settings']);
    expect(within(nav).getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument();
  });

  it('collapses to the rail, moves focus to the logo and remembers the choice', async () => {
    const user = userEvent.setup();
    renderApp('/transactions');

    await user.click(await screen.findByRole('button', { name: 'Collapse sidebar' }));

    expect(resizeHandle()).toHaveAttribute('aria-valuetext', 'Collapsed');
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveFocus();
    expect(JSON.parse(localStorage.getItem('pup.sidebar') ?? 'null')).toMatchObject({
      collapsed: true,
    });

    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));

    expect(resizeHandle()).toHaveAttribute('aria-valuetext', '248 pixels');
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toHaveFocus();
  });

  it('starts collapsed below 1024 px', async () => {
    setScreenWidth(900);
    renderApp('/transactions');

    expect(await screen.findByRole('separator', { name: 'Resize sidebar' })).toHaveAttribute(
      'aria-valuetext',
      'Collapsed',
    );
  });

  it('resizes and collapses with the keyboard on the edge', async () => {
    const user = userEvent.setup();
    renderApp('/transactions');
    const handle = await screen.findByRole('separator', { name: 'Resize sidebar' });

    handle.focus();
    await user.keyboard('{ArrowRight}');
    expect(handle).toHaveAttribute('aria-valuenow', '264');

    await user.keyboard('{Enter}');
    expect(handle).toHaveAttribute('aria-valuetext', 'Collapsed');
  });

  it('opens adding a transaction from the sidebar', async () => {
    const user = userEvent.setup();
    renderApp('/reports');

    const sidebar = await screen.findByRole('complementary', { name: 'Sidebar' });
    await user.click(within(sidebar).getByRole('button', { name: 'Add transaction' }));

    expect(await screen.findByRole('dialog', { name: 'Add transaction' })).toBeInTheDocument();
  });
});
