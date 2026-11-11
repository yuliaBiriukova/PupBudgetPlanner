import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { answer } from '../../test/mockRoutes';
import { LOADED, renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server } from '../../test/server';
import type { CategoriesOverview } from './categoriesApi';
import { fakeCategoriesRoutes } from './categoriesFakeApi';
import { DEFAULT_CATEGORIES, EDITED_CATEGORIES, NO_CATEGORIES } from './categoriesTestData';

interface Sent {
  method: string;
  path: string;
  body: unknown;
}

/** The categories API with the API's rules, keeping every change; returns the changes sent to it. */
function categoriesServer(overview: CategoriesOverview = DEFAULT_CATEGORIES) {
  const routes = fakeCategoriesRoutes(overview);
  const sent: Sent[] = [];
  server.use(
    http.all('/api/categories*', async ({ request }) => {
      const url = new URL(request.url);
      const text = request.method === 'GET' ? '' : await request.text();
      const body = text ? (JSON.parse(text) as unknown) : undefined;
      if (request.method !== 'GET') sent.push({ method: request.method, path: url.pathname, body });
      return answer(routes, request.method, url, body);
    }),
  );
  return sent;
}

/** A group's tags as the page shows them, without its + Add. */
const tagsOf = (element: HTMLElement) =>
  within(element)
    .getAllByRole('listitem')
    .map((item) => item.textContent)
    .filter((text) => text !== 'Add');

/** A group's row on the phone: its name, count and arrow (its pencil is another button). */
const groupRow = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

describe('the Categories page on the phone', () => {
  it('starts with every group folded but Income, the expenses under their label', async () => {
    categoriesServer();
    renderApp('/categories');

    expect(await screen.findByText('33 categories in 7 groups', {}, LOADED)).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      'Income3',
      'Home expensesRent, Bills, Home supplies and 6 more9',
      'Daily livingGroceries, Clothing, Eating out and 3 more6',
      'HealthDoctor/Dentist, Medicine/Drugs/Skincare, Emergency and Therapy4',
      'EducationEnglish lessons, Piano lessons and Driving3',
      'EntertainmentActivities, Books, Games and 2 more5',
      'SubscriptionsSpotify, Phone and Subscriptions3',
    ]);
    expect(screen.getByText('30 categories')).toBeInTheDocument();
    const income = groupRow('Income');
    expect(income).toHaveAttribute('aria-expanded', 'true');
    const tags = document.getElementById(income.getAttribute('aria-controls') ?? '');
    expect(tags && tagsOf(tags)).toEqual(['Salary', 'Gifts', 'Other']);
    expect(
      within(screen.getByRole('main')).getAllByRole('button', { expanded: false }),
    ).toHaveLength(6);
    expect(screen.queryByText(/come after the first release/)).not.toBeInTheDocument();
  });

  it('opens several groups at once, folds them again and remembers it', async () => {
    categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    await screen.findByText('33 categories in 7 groups', {}, LOADED);
    const home = groupRow('Home expenses');
    await user.click(home);
    await user.click(groupRow('Health'));

    expect(home).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Bank commission')).toBeInTheDocument();
    expect(screen.getByText('Therapy')).toBeInTheDocument();
    expect(groupRow('Income')).toHaveAttribute('aria-expanded', 'true');
    expect(JSON.parse(localStorage.getItem('pup.categories.open') ?? '[]')).toEqual([
      'group-1',
      'group-2',
      'group-4',
    ]);

    await user.click(home);
    expect(home).toHaveAttribute('aria-expanded', 'false');
    expect(home).toHaveTextContent('Rent, Bills, Home supplies and 6 more');
    expect(screen.queryByText('Bank commission')).not.toBeInTheDocument();
  });

  it('collapses and expands every group at once', async () => {
    categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    await user.click(await screen.findByRole('button', { name: 'Collapse all' }, LOADED));
    expect(
      within(screen.getByRole('main')).getAllByRole('button', { expanded: false }),
    ).toHaveLength(7);
    expect(
      within(screen.getByRole('main')).queryByRole('button', { expanded: true }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(
      within(screen.getByRole('main')).getAllByRole('button', { expanded: true }),
    ).toHaveLength(7);
  });

  it('opens only the group picked on the desktop', async () => {
    localStorage.setItem('pup.categories.open', JSON.stringify(['group-5']));
    categoriesServer();
    renderApp('/categories');

    await screen.findByText('33 categories in 7 groups', {}, LOADED);
    expect(groupRow('Education')).toHaveAttribute('aria-expanded', 'true');
    expect(
      within(screen.getByRole('main')).getAllByRole('button', { expanded: false }),
    ).toHaveLength(6);
    expect(groupRow('Income')).toHaveTextContent('Salary, Gifts and Other');
  });

  it('starts with Income open when what is stored belongs to someone else', async () => {
    localStorage.setItem('pup.categories.open', JSON.stringify(['another-persons-group']));
    categoriesServer();
    renderApp('/categories');

    await screen.findByText('33 categories in 7 groups', {}, LOADED);
    expect(groupRow('Income')).toHaveAttribute('aria-expanded', 'true');
    expect(
      within(screen.getByRole('main')).getAllByRole('button', { expanded: false }),
    ).toHaveLength(6);
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

describe('changing a category (F-029)', () => {
  it('renames a category and moves it up in its group, by the keys', async () => {
    const sent = categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    await user.click(await screen.findByRole('button', { name: 'Gifts' }, LOADED));
    const sheet = await screen.findByRole('dialog', { name: 'Edit category' });
    expect(within(sheet).getByRole('radio', { name: 'Income' })).toBeChecked();
    const place = within(sheet).getByRole('list', { name: 'Place in Income' });
    expect(
      within(place)
        .getAllByRole('listitem')
        .map((row) => row.textContent),
    ).toEqual(['Salary', 'Gifts', 'Other']);

    const name = within(sheet).getByRole('textbox', { name: 'Name' });
    await user.clear(name);
    await user.type(name, 'Presents');
    await user.click(within(sheet).getByRole('button', { name: 'Move “Presents” up' }));
    expect(within(sheet).getByRole('button', { name: 'Move “Presents” up' })).toBeDisabled();
    await user.click(within(sheet).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('“Presents” saved')).toBeInTheDocument();
    expect(sent).toEqual([
      {
        method: 'PUT',
        path: '/api/categories/group-1-2',
        body: { name: 'Presents', groupId: 'group-1', place: 0 },
      },
    ]);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    const tags = document.getElementById(groupRow('Income').getAttribute('aria-controls') ?? '');
    await waitFor(() => {
      expect(tags && tagsOf(tags)).toEqual(['Presents', 'Salary', 'Other']);
    });
  });

  it('moves a category to another group of its kind, at its end', async () => {
    localStorage.setItem('pup.categories.open', JSON.stringify(['group-3']));
    const sent = categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    await user.click(await screen.findByRole('button', { name: 'Sport' }, LOADED));
    const sheet = await screen.findByRole('dialog', { name: 'Edit category' });
    // Only the groups of its kind
    expect(within(sheet).queryByRole('radio', { name: 'Income' })).not.toBeInTheDocument();
    await user.click(within(sheet).getByRole('radio', { name: 'Health' }));
    expect(
      within(within(sheet).getByRole('list', { name: 'Place in Health' }))
        .getAllByRole('listitem')
        .at(-1),
    ).toHaveTextContent('Sport');
    await user.click(within(sheet).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('“Sport” moved to Health')).toBeInTheDocument();
    expect(sent[0]).toEqual({
      method: 'PUT',
      path: '/api/categories/group-3-6',
      body: { name: 'Sport', groupId: 'group-4', place: 4 },
    });
  });

  it('says a name is taken in the group before anything is sent', async () => {
    const sent = categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    await user.click(
      await screen.findByRole('button', { name: 'Add a category to Income' }, LOADED),
    );
    const sheet = await screen.findByRole('dialog', { name: 'New category' });
    await user.click(within(sheet).getByRole('button', { name: 'Add' }));
    expect(within(sheet).getByText('Type a name')).toBeInTheDocument();

    await user.type(within(sheet).getByRole('textbox', { name: 'Name' }), 'salary ');
    expect(within(sheet).getByText('“Salary” is already in Income')).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: 'Add' }));
    expect(sent).toEqual([]);
  });

  it('adds a category at the end of its group', async () => {
    const sent = categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    await user.click(
      await screen.findByRole('button', { name: 'Add a category to Income' }, LOADED),
    );
    const sheet = await screen.findByRole('dialog', { name: 'New category' });
    await user.type(within(sheet).getByRole('textbox', { name: 'Name' }), '  Bonus {Enter}');

    expect(await screen.findByText('“Bonus” added')).toBeInTheDocument();
    expect(sent).toEqual([
      {
        method: 'POST',
        path: '/api/categories',
        body: { groupId: 'group-1', name: 'Bonus', place: 3 },
      },
    ]);
  });

  it('offers to show a hidden category with the typed name again', async () => {
    const sent = categoriesServer(EDITED_CATEGORIES);
    const user = userEvent.setup();
    renderApp('/categories');

    await screen.findByText('33 categories in 7 groups', {}, LOADED);
    await user.click(groupRow('Subscriptions'));
    await user.click(screen.getByRole('button', { name: 'Add a category to Subscriptions' }));
    const sheet = await screen.findByRole('dialog', { name: 'New category' });
    await user.type(within(sheet).getByRole('textbox', { name: 'Name' }), 'netflix');
    expect(
      within(sheet).getByText(/“Netflix” is already in Subscriptions, hidden/),
    ).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: 'Show it again' }));

    expect(await screen.findByText('“Netflix” is back in Subscriptions')).toBeInTheDocument();
    expect(sent).toEqual([
      { method: 'POST', path: '/api/categories/group-7-netflix/restore', body: undefined },
    ]);
  });

  it('deletes a category without transactions after asking', async () => {
    localStorage.setItem('pup.categories.open', JSON.stringify(['group-2']));
    const sent = categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    await user.click(await screen.findByRole('button', { name: 'Tax' }, LOADED));
    const sheet = await screen.findByRole('dialog', { name: 'Edit category' });
    expect(sheet).toHaveTextContent('Delete this category');
    expect(sheet).toHaveTextContent('It has no transactions, so it’s deleted for good.');
    await user.click(within(sheet).getByRole('button', { name: 'Delete' }));

    const ask = await screen.findByRole('dialog', { name: 'Delete “Tax”?' });
    await user.click(within(ask).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('“Tax” deleted')).toBeInTheDocument();
    expect(sent).toEqual([
      { method: 'DELETE', path: '/api/categories/group-2-7', body: undefined },
    ]);
  });

  it('hides a category with transactions, says what it keeps, and can keep it after all', async () => {
    const sent = categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    await user.click(await screen.findByRole('button', { name: 'Salary' }, LOADED));
    const sheet = await screen.findByRole('dialog', { name: 'Edit category' });
    expect(sheet).toHaveTextContent('Hide this category');
    expect(sheet).toHaveTextContent(/It has \d+ transactions, so it’s hidden, not deleted\./);
    await user.click(within(sheet).getByRole('button', { name: 'Hide' }));

    let ask = await screen.findByRole('dialog', { name: 'Hide “Salary”?' });
    expect(ask).toHaveTextContent('the reports and the Transactions filters still show it');
    await user.click(within(ask).getByRole('button', { name: 'Keep it' }));
    expect(await screen.findByRole('dialog', { name: 'Edit category' })).toBeInTheDocument();
    expect(sent).toEqual([]);

    await user.click(screen.getByRole('button', { name: 'Hide' }));
    ask = await screen.findByRole('dialog', { name: 'Hide “Salary”?' });
    await user.click(within(ask).getByRole('button', { name: 'Hide' }));

    expect(
      await screen.findByText('“Salary” hidden. Its transactions keep it'),
    ).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Salary, hidden' })).toBeInTheDocument();
  });

  it('shows a hidden category again from its own sheet', async () => {
    const sent = categoriesServer(EDITED_CATEGORIES);
    const user = userEvent.setup();
    renderApp('/categories');

    await screen.findByText('33 categories in 7 groups', {}, LOADED);
    await user.click(groupRow('Subscriptions'));
    await user.click(screen.getByRole('button', { name: 'Netflix, hidden' }));
    const sheet = await screen.findByRole('dialog', { name: '“Netflix” is hidden' });
    expect(sheet).toHaveTextContent('It has 9 transactions and keeps them.');
    await user.click(within(sheet).getByRole('button', { name: 'Show again' }));

    expect(await screen.findByText('“Netflix” is back in Subscriptions')).toBeInTheDocument();
    expect(sent).toEqual([
      { method: 'POST', path: '/api/categories/group-7-netflix/restore', body: undefined },
    ]);
  });

  it('keeps the sheet open and says so when a change didn’t go through', async () => {
    server.use(
      http.get('/api/categories', () => HttpResponse.json(DEFAULT_CATEGORIES)),
      http.put('/api/categories/:id', () => new HttpResponse(null, { status: 500 })),
    );
    const user = userEvent.setup();
    renderApp('/categories');

    await user.click(await screen.findByRole('button', { name: 'Gifts' }, LOADED));
    const sheet = await screen.findByRole('dialog', { name: 'Edit category' });
    await user.click(within(sheet).getByRole('button', { name: 'Save' }));

    expect(await within(sheet).findByRole('alert')).toHaveTextContent(
      'That didn’t go through. Try again in a moment.',
    );
  });
});

describe('changing a group (F-029)', () => {
  it('says why a group with categories, or the only one of its kind, stays', async () => {
    categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    await user.click(await screen.findByRole('button', { name: 'Edit the group Health' }, LOADED));
    let sheet = await screen.findByRole('dialog', { name: 'Edit group' });
    expect(sheet).toHaveTextContent(
      'It still has 4 categories. Move them to another group or remove them first.',
    );
    expect(within(sheet).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: 'Cancel' }));

    await user.click(screen.getByRole('button', { name: 'Edit the group Income' }));
    sheet = await screen.findByRole('dialog', { name: 'Edit group' });
    expect(sheet).toHaveTextContent('It’s your only income group, so it stays.');
  });

  it('adds an expense group, then deletes it while it is empty', async () => {
    const sent = categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    await user.click(await screen.findByRole('button', { name: 'Add expense group' }, LOADED));
    let sheet = await screen.findByRole('dialog', { name: 'New group' });
    expect(within(sheet).getByRole('radio', { name: 'Expenses' })).toBeChecked();
    await user.type(within(sheet).getByRole('textbox', { name: 'Name' }), 'health');
    expect(within(sheet).getByText('You already have a group “Health”')).toBeInTheDocument();
    await user.clear(within(sheet).getByRole('textbox', { name: 'Name' }));
    await user.type(within(sheet).getByRole('textbox', { name: 'Name' }), 'Pets');
    await user.click(within(sheet).getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Group “Pets” added')).toBeInTheDocument();
    expect(sent[0]).toEqual({
      method: 'POST',
      path: '/api/categories/groups',
      body: { kind: 'Expense', name: 'Pets', place: 6 },
    });

    await user.click(await screen.findByRole('button', { name: 'Edit the group Pets' }));
    sheet = await screen.findByRole('dialog', { name: 'Edit group' });
    expect(sheet).toHaveTextContent('It has no categories, so it’s deleted for good.');
    await user.click(within(sheet).getByRole('button', { name: 'Delete' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Delete the group “Pets”?' })).getByRole(
        'button',
        { name: 'Delete' },
      ),
    );

    expect(await screen.findByText('Group “Pets” deleted')).toBeInTheDocument();
    expect(sent[1]).toMatchObject({ method: 'DELETE', path: '/api/categories/groups/new-group-1' });
  });

  it('renames a group and moves it first among its kind', async () => {
    const sent = categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    await user.click(
      await screen.findByRole('button', { name: 'Edit the group Subscriptions' }, LOADED),
    );
    const sheet = await screen.findByRole('dialog', { name: 'Edit group' });
    const name = within(sheet).getByRole('textbox', { name: 'Name' });
    await user.clear(name);
    await user.type(name, 'Online');
    for (let step = 0; step < 5; step++)
      await user.click(within(sheet).getByRole('button', { name: 'Move “Online” up' }));
    await user.click(within(sheet).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Group “Online” saved')).toBeInTheDocument();
    expect(sent).toEqual([
      {
        method: 'PUT',
        path: '/api/categories/groups/group-7',
        body: { name: 'Online', place: 0 },
      },
    ]);
    await waitFor(() => {
      expect(screen.getAllByRole('heading', { level: 2 })[1]).toHaveTextContent(/^Online/);
    });
  });

  it('shows a hidden group at the end of its kind, with Show', async () => {
    const sent = categoriesServer(EDITED_CATEGORIES);
    const user = userEvent.setup();
    renderApp('/categories');

    await user.click(await screen.findByRole('button', { name: 'Show Car again' }, LOADED));

    expect(await screen.findByText('Group “Car” is back')).toBeInTheDocument();
    expect(sent).toEqual([
      { method: 'POST', path: '/api/categories/groups/group-car/restore', body: undefined },
    ]);
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
    expect(within(index).getByRole('button', { name: /^Income/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    let detail = screen.getByRole('region', { name: 'Income' });
    expect(detail).toHaveTextContent('3 categories');
    expect(tagsOf(detail)).toEqual(['Salary', 'Gifts', 'Other']);

    await user.click(within(index).getByRole('button', { name: /^Home expenses/ }));

    detail = screen.getByRole('region', { name: 'Home expenses' });
    expect(detail).toHaveTextContent('Expenses, 9 categories');
    expect(tagsOf(detail)).toHaveLength(9);
    expect(within(index).getByRole('button', { name: /^Home expenses/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.queryByRole('button', { name: 'Collapse all' })).not.toBeInTheDocument();
    // The picked group is the only open one, so the phone opens just that one
    expect(JSON.parse(localStorage.getItem('pup.categories.open') ?? '[]')).toEqual(['group-2']);
  });

  it('shows the group opened last on the phone', async () => {
    setScreenWidth(1440);
    localStorage.setItem('pup.categories.open', JSON.stringify(['group-1', 'group-6']));
    categoriesServer();
    renderApp('/categories');

    const index = await screen.findByRole('navigation', { name: 'Category groups' }, LOADED);
    expect(within(index).getByRole('button', { name: /^Entertainment/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(tagsOf(screen.getByRole('region', { name: 'Entertainment' }))).toHaveLength(5);
  });

  it('opens the picked group’s sheet from Edit group', async () => {
    setScreenWidth(1440);
    categoriesServer();
    const user = userEvent.setup();
    renderApp('/categories');

    await user.click(await screen.findByRole('button', { name: 'Edit group' }, LOADED));

    const sheet = await screen.findByRole('dialog', { name: 'Edit group' });
    expect(within(sheet).getByRole('textbox', { name: 'Name' })).toHaveValue('Income');
  });
});
