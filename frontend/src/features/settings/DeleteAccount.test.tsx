import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LOADED, renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server } from '../../test/server';
import { OVERVIEW } from '../accounts/accountsTestData';
import { ANDRIY_ID, ownersFamily } from '../family/familyTestData';
import type { DeletionSummary } from './deleteAccountApi';

const SUMMARY: DeletionSummary = {
  accounts: 9,
  transactions: 1284,
  categories: 1,
  hasPassword: true,
  canDelete: true,
  googleConfirmed: false,
};

/** The API for Settings and Delete account; returns what Delete sent. `answer` is the deletion's reply. */
function deleteServer({
  summary = SUMMARY,
  family = null as ReturnType<typeof ownersFamily> | null,
  answer = () => new HttpResponse(null, { status: 204 }) as Response,
} = {}) {
  const sent: unknown[] = [];
  server.use(
    http.get('/api/settings', () =>
      HttpResponse.json({
        displayName: 'Olena',
        email: 'olena@example.com',
        reportCurrency: 'UAH',
      }),
    ),
    http.get('/api/accounts', () => HttpResponse.json(OVERVIEW)),
    http.get('/api/accounts/total', () => new HttpResponse(null, { status: 503 })),
    http.get('/api/me/deletion', () => HttpResponse.json(summary)),
    http.get('/api/family', () =>
      family ? HttpResponse.json(family) : new HttpResponse(null, { status: 204 }),
    ),
    http.post('/api/me/delete', async ({ request }) => {
      sent.push(await request.json());
      return answer();
    }),
  );
  return sent;
}

const dialog = () => screen.getByRole('dialog', { name: 'Delete your account?' });

async function openDialog() {
  await userEvent.click(await screen.findByRole('button', { name: 'Delete account' }, LOADED));
  return screen.findByRole('dialog', { name: 'Delete your account?' });
}

beforeEach(() => {
  setScreenWidth(1440);
  document.cookie = 'XSRF-TOKEN=token-from-the-api; path=/';
});

afterEach(() => {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  localStorage.clear();
});

describe('Delete account on Settings', () => {
  it('says what goes in the person’s own counts and that the money stays in the banks', async () => {
    deleteServer();
    renderApp('/settings');

    expect(
      await screen.findByText(
        'Deletes your accounts, transactions and categories for good.',
        {},
        LOADED,
      ),
    ).toBeInTheDocument();
    const opened = await openDialog();

    const whatGoes = await within(opened).findByText(/^9 accounts/);
    // 1 284 with a no-break space, so the figure never splits over two lines
    expect(whatGoes.textContent).toBe(
      '9 accounts, 1 284 transactions and 1 category, your settings and the ways you sign in. ' +
        'The money itself stays in your banks: only Pup’s record of it goes.',
    );
    expect(within(opened).getByLabelText('Your password')).toBeInTheDocument();
    expect(
      within(opened).getByText(
        'It can’t be undone. To use Pup Budget again later, you’d need a new invite link.',
      ),
    ).toBeInTheDocument();
  });

  it('asks for the password and the word before sending anything', async () => {
    const sent = deleteServer();
    renderApp('/settings');
    const opened = await openDialog();
    await within(opened).findByText(/9 accounts/);

    await userEvent.type(within(opened).getByLabelText('Type DELETE to confirm'), 'remove');
    await userEvent.click(within(opened).getByRole('button', { name: 'Delete for good' }));

    expect(within(opened).getByText('Enter your password.')).toBeInTheDocument();
    expect(within(opened).getByText('Type DELETE to confirm.')).toBeInTheDocument();
    expect(sent).toHaveLength(0);
  });

  it('deletes with the password and the word in any case, then says the account is deleted', async () => {
    const sent = deleteServer();
    const { router } = renderApp('/settings');
    const opened = await openDialog();
    await within(opened).findByText(/9 accounts/);

    await userEvent.type(within(opened).getByLabelText('Your password'), 'correct horse');
    await userEvent.type(within(opened).getByLabelText('Type DELETE to confirm'), 'delete');
    await userEvent.click(within(opened).getByRole('button', { name: 'Delete for good' }));

    expect(
      await screen.findByRole('heading', { name: 'Your account is deleted' }),
    ).toBeInTheDocument();
    expect(sent).toEqual([{ word: 'delete', password: 'correct horse', newOwnerId: null }]);
    expect(router.state.location.pathname).toBe('/account-deleted');
    expect(screen.getByRole('link', { name: 'Go to sign in' })).toHaveAttribute('href', '/sign-in');
  });

  it('says so under the password when the API finds it wrong, and keeps the dialog open', async () => {
    deleteServer({
      answer: () =>
        HttpResponse.json(
          { title: 'One or more validation errors occurred.', errors: { password: ['x'] } },
          { status: 400 },
        ),
    });
    renderApp('/settings');
    const opened = await openDialog();
    await within(opened).findByText(/9 accounts/);

    await userEvent.type(within(opened).getByLabelText('Your password'), 'wrong one');
    await userEvent.type(within(opened).getByLabelText('Type DELETE to confirm'), 'DELETE');
    await userEvent.click(within(opened).getByRole('button', { name: 'Delete for good' }));

    expect(await within(opened).findByText('That password isn’t right.')).toBeInTheDocument();
    expect(dialog()).toBeVisible();
  });

  it('has the family’s owner pick who looks after the family next', async () => {
    const sent = deleteServer({ family: ownersFamily() });
    renderApp('/settings');
    const opened = await openDialog();
    const heirs = await within(opened).findByRole('radiogroup', {
      name: 'Who looks after the family next?',
    });

    await userEvent.type(within(opened).getByLabelText('Your password'), 'correct horse');
    await userEvent.type(within(opened).getByLabelText('Type DELETE to confirm'), 'DELETE');
    await userEvent.click(within(opened).getByRole('button', { name: 'Delete for good' }));
    expect(within(opened).getByText('Pick who looks after the family.')).toBeInTheDocument();
    expect(sent).toHaveLength(0);

    await userEvent.click(within(heirs).getByRole('radio', { name: 'Andriy' }));
    await userEvent.click(within(opened).getByRole('button', { name: 'Delete for good' }));

    await screen.findByRole('heading', { name: 'Your account is deleted' });
    expect(sent).toEqual([{ word: 'DELETE', password: 'correct horse', newOwnerId: ANDRIY_ID }]);
  });

  it('tells a member they leave the family', async () => {
    const family = { ...ownersFamily(), isOwner: false };
    family.members = family.members.map((m) => ({ ...m, isOwner: m.displayName === 'Andriy' }));
    deleteServer({ family });
    renderApp('/settings');
    const opened = await openDialog();

    expect(await within(opened).findByText('You leave the Kovalenko family')).toBeInTheDocument();
    expect(
      within(opened).getByText('Andriy and Iryna won’t see your money any more.'),
    ).toBeInTheDocument();
    expect(within(opened).queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('shows the admin why their account can’t be deleted, with no button', async () => {
    deleteServer({ summary: { ...SUMMARY, canDelete: false } });
    renderApp('/settings');

    expect(
      await screen.findByText(
        /You look after Pup Budget, so your account can’t be deleted here/,
        {},
        LOADED,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete account' })).not.toBeInTheDocument();
  });

  it('sends someone with only Google to Google, and back on Settings with the dialog confirmed', async () => {
    const sent = deleteServer({
      summary: { ...SUMMARY, hasPassword: false, googleConfirmed: true },
    });
    const { router } = renderApp('/settings?delete=google');

    const opened = await screen.findByRole('dialog', { name: 'Delete your account?' }, LOADED);
    expect(
      await within(opened).findByText('Confirmed with Google as olena@example.com'),
    ).toBeInTheDocument();
    expect(within(opened).queryByLabelText('Your password')).not.toBeInTheDocument();
    // The address is cleaned, so a reload doesn't open it again
    await waitFor(() => {
      expect(router.state.location.search).toBe('');
    });

    await userEvent.type(within(opened).getByLabelText('Type DELETE to confirm'), 'DELETE');
    await userEvent.click(within(opened).getByRole('button', { name: 'Delete for good' }));

    await screen.findByRole('heading', { name: 'Your account is deleted' });
    expect(sent).toEqual([{ word: 'DELETE', password: null, newOwnerId: null }]);
  });

  it('offers Confirm with Google until it is done, and says when it didn’t work', async () => {
    deleteServer({ summary: { ...SUMMARY, hasPassword: false } });
    renderApp('/settings?delete=google-failed');

    const opened = await screen.findByRole('dialog', { name: 'Delete your account?' }, LOADED);
    expect(
      await within(opened).findByRole('link', { name: 'Confirm with Google' }),
    ).toHaveAttribute('href', '/api/me/delete/google');
    expect(
      within(opened).getByText(
        'Couldn’t confirm with Google. Try again with the Google account you sign in with.',
      ),
    ).toBeInTheDocument();
  });

  it('Keep my account closes the dialog and deletes nothing', async () => {
    const sent = deleteServer();
    renderApp('/settings');
    const opened = await openDialog();
    await within(opened).findByText(/9 accounts/);

    await userEvent.click(within(opened).getByRole('button', { name: 'Keep my account' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Delete your account?' }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeVisible();
    expect(sent).toHaveLength(0);
  });
});
