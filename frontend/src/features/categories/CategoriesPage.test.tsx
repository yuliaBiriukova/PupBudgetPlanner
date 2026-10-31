import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server } from '../../test/server';
import type { CategoriesOverview } from './categoriesApi';
import { DEFAULT_CATEGORIES, NO_CATEGORIES } from './categoriesTestData';

/** The first render of the app can take over a second on a busy machine: waits for the page to load get longer. */
const LOADED = { timeout: 4000 };

function categoriesServer(overview: CategoriesOverview = DEFAULT_CATEGORIES) {
  server.use(http.get('/api/categories', () => HttpResponse.json(overview)));
}

const tagsOf = (element: HTMLElement) =>
  within(element)
    .getAllByRole('listitem')
    .map((item) => item.textContent);

describe('the Categories page on the phone', () => {
  it('shows every group open with its categories, Income first and the expenses under their label', async () => {
    categoriesServer();
    renderApp('/categories');

    expect(await screen.findByText('33 categories in 7 groups', {}, LOADED)).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      'Income3',
      'Home expenses9',
      'Daily living6',
      'Health4',
      'Education3',
      'Entertainment5',
      'Subscriptions3',
    ]);
    expect(screen.getByText('30 categories')).toBeInTheDocument();
    const income = screen.getByRole('button', { name: /Income/ });
    expect(income).toHaveAttribute('aria-expanded', 'true');
    const tags = document.getElementById(income.getAttribute('aria-controls') ?? '');
    expect(tags && tagsOf(tags)).toEqual(['Salary', 'Gifts', 'Other']);
  });

  it('folds a group to its first categories and remembers it', async () => {
    categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    const home = await screen.findByRole('button', { name: /Home expenses/ }, LOADED);
    await user.click(home);

    expect(home).toHaveAttribute('aria-expanded', 'false');
    expect(home).toHaveTextContent('Rent, Bills, Home supplies and 6 more');
    expect(screen.queryByText('Bank commission')).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('pup.categories.folded') ?? '[]')).toEqual(['group-2']);

    await user.click(home);
    expect(home).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Bank commission')).toBeInTheDocument();
  });

  it('collapses and expands every group at once', async () => {
    categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    await user.click(await screen.findByRole('button', { name: 'Collapse all' }, LOADED));

    for (const group of screen.getAllByRole('button', { expanded: false })) {
      expect(group).toHaveAttribute('aria-expanded', 'false');
    }
    expect(screen.getAllByRole('button', { expanded: false })).toHaveLength(7);
    expect(screen.getByRole('button', { name: /Health/ })).toHaveTextContent(
      'Doctor/Dentist, Medicine/Drugs/Skincare, Emergency and Therapy',
    );

    await user.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(7);
  });

  it('starts with the groups folded on this device', async () => {
    localStorage.setItem('pup.categories.folded', JSON.stringify(['group-1', 'group-7']));
    categoriesServer();
    renderApp('/categories');

    expect(await screen.findByRole('button', { name: /Income/ }, LOADED)).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: /Subscriptions/ })).toHaveTextContent(
      'Spotify, Phone and Subscriptions',
    );
    expect(screen.getByRole('button', { name: /Health/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('says what to do when there are no categories', async () => {
    categoriesServer(NO_CATEGORIES);
    renderApp('/categories');

    expect(
      await screen.findByRole('heading', { name: 'No categories here' }, LOADED),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('offers to try again when they could not be loaded', async () => {
    server.use(http.get('/api/categories', () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    renderApp('/categories');

    const alert = await screen.findByRole('alert', {}, LOADED);
    expect(alert).toHaveTextContent('Couldn’t load your categories.');

    categoriesServer();
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('33 categories in 7 groups', {}, LOADED)).toBeInTheDocument();
  });
});

describe('the Categories page on the desktop', () => {
  it('lists the groups and shows the picked one’s categories beside them', async () => {
    setScreenWidth(1440);
    categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    const index = await screen.findByRole('navigation', { name: 'Category groups' }, LOADED);
    expect(
      screen.getByText('33 categories in 7 groups, in the order of your report.'),
    ).toBeInTheDocument();
    expect(within(index).getByText('6 groups')).toBeInTheDocument();
    expect(within(index).getByRole('button', { name: /Income/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    let detail = screen.getByRole('region', { name: 'Income' });
    expect(detail).toHaveTextContent('3 categories');
    expect(tagsOf(detail)).toEqual(['Salary', 'Gifts', 'Other']);

    await user.click(within(index).getByRole('button', { name: /Home expenses/ }));

    detail = screen.getByRole('region', { name: 'Home expenses' });
    expect(detail).toHaveTextContent('Expenses, 9 categories');
    expect(tagsOf(detail)).toHaveLength(9);
    expect(within(index).getByRole('button', { name: /Home expenses/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.queryByRole('button', { name: 'Collapse all' })).not.toBeInTheDocument();
  });
});
