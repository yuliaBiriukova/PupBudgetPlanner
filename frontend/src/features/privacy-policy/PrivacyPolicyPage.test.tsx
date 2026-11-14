import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LOADED, renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server } from '../../test/server';

const SECTION_TITLES = [
  'What Pup Budget keeps',
  'Why',
  'Who can see your data',
  'Where it is kept',
  'How it is protected',
  'How long it is kept',
  'Your choices',
  'Changes to this page',
];

/** Nobody signed in: the app's start is Sign in. */
function signedOut() {
  server.use(
    http.get('/api/auth/me', () => new HttpResponse(null, { status: 204 })),
    http.get('/api/auth/sign-up', () => HttpResponse.json({ mode: 'InviteOnly' })),
  );
}

/** Every request the app makes while the test runs. */
function watchRequests() {
  const urls: string[] = [];
  const listener = ({ request }: { request: Request }) => {
    urls.push(new URL(request.url).pathname);
  };
  server.events.on('request:start', listener);
  return urls;
}

/** The contents: beside the text (0) or folded under the intro (1). */
async function contentsNav(which: 0 | 1 = 0) {
  const navs = await screen.findAllByRole('navigation', { name: 'On this page' }, LOADED);
  const nav = navs[which];
  if (!nav) throw new Error('No contents');
  return nav;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  server.events.removeAllListeners();
});

describe('the privacy policy page', () => {
  it('shows the whole policy with its date, and asks the API for nothing', async () => {
    const requests = watchRequests();
    renderApp('/privacy');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Privacy policy' }, LOADED),
    ).toBeInTheDocument();
    expect(screen.getByText('Last updated 14 November 2026')).toBeInTheDocument();
    expect(screen.getByText(/never sells or shares your data/)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(
      SECTION_TITLES,
    );
    expect(screen.getByText(/restore history within 6 hours/)).toBeInTheDocument();
    expect(screen.getByText('Nobody else.')).toBeInTheDocument();
    expect(requests).toEqual([]);
  });

  it('gives the contact address from the build setting', async () => {
    vi.stubEnv('VITE_CONTACT_EMAIL', ' pup.budget@example.com ');
    renderApp('/privacy');

    const choices = await screen.findByRole('region', { name: 'Your choices' }, LOADED);
    expect(within(choices).getByText(/write to pup\.budget@example\.com from your/)).toBeVisible();
    expect(within(choices).getByText(/about your data: pup\.budget@example\.com\./)).toBeVisible();
  });

  it('names the person who runs the app when no address is set', async () => {
    vi.stubEnv('VITE_CONTACT_EMAIL', '');
    renderApp('/privacy');

    const choices = await screen.findByRole('region', { name: 'Your choices' }, LOADED);
    expect(
      within(choices).getByText(/write to the person who runs Pup Budget from your/),
    ).toBeVisible();
  });

  it('lists the sections beside the text on the desktop, the first one marked', async () => {
    setScreenWidth(1440);
    renderApp('/privacy');

    const links = within(await contentsNav()).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(SECTION_TITLES);
    expect(links[0]).toHaveAttribute('aria-current', 'location');
    expect(links[0]).toHaveAttribute('href', '#privacy-what');
  });

  it('marks a section picked in the contents and goes to it', async () => {
    const user = userEvent.setup();
    renderApp('/privacy');
    const contents = await contentsNav();
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');

    await user.click(within(contents).getByRole('link', { name: 'Your choices' }));

    expect(within(contents).getByRole('link', { name: 'Your choices' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    expect(scroll).toHaveBeenCalled();
  });

  it('folds the contents on the phone, and closes them once a section is picked', async () => {
    const user = userEvent.setup();
    renderApp('/privacy');
    const fold = await screen.findByRole('button', { name: 'On this page' }, LOADED);
    expect(fold).toHaveAttribute('aria-expanded', 'false');

    await user.click(fold);
    expect(fold).toHaveAttribute('aria-expanded', 'true');
    const folded = await contentsNav(1);
    await user.click(await within(folded).findByRole('link', { name: 'Why' }));

    expect(fold).toHaveAttribute('aria-expanded', 'false');
  });

  it('goes back to the page it was opened from', async () => {
    signedOut();
    const user = userEvent.setup();
    const { router } = renderApp('/sign-in');
    await user.click(await screen.findByRole('link', { name: 'Privacy policy' }, LOADED));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Privacy policy' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/sign-in');
    });
  });

  it('goes to the app when it was opened straight from a link', async () => {
    signedOut();
    const user = userEvent.setup();
    const { router } = renderApp('/privacy');

    await user.click(await screen.findByRole('button', { name: 'Back' }, LOADED));

    // The app's start: Sign in for someone signed out
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/sign-in');
    });
  });
});
