import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOADED, renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { isIosSafari, listenForInstall, resetInstallForTests } from './install';
import { answerTransactionsPage } from './pwaTestApi';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1';
const IPAD_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.7444.46 Mobile/15E148 Safari/604.1';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36';

/** Chrome's or Edge's install offer, as the browser fires it; the person accepts its dialog. */
function offerInstall(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const prompt = vi.fn(() => Promise.resolve());
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return prompt;
}

function onIosSafari() {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_SAFARI);
}

/** The card at the top of the page (F-025). */
const card = () => screen.queryByRole('region', { name: 'Install the app' });

beforeAll(() => {
  listenForInstall();
});

beforeEach(() => {
  answerTransactionsPage();
});

afterEach(() => {
  act(() => {
    resetInstallForTests();
  });
});

describe('which browser gets Safari’s steps', () => {
  it.each([
    ['Safari on the iPhone', IPHONE_SAFARI, 5, true],
    ['Safari on the iPad, which says it is a Mac', IPAD_SAFARI, 5, true],
    ['Safari on a Mac', IPAD_SAFARI, 0, false],
    ['Chrome on the iPhone', IPHONE_CHROME, 5, false],
    ['Chrome on Android', ANDROID_CHROME, 5, false],
  ])('%s', (_name, userAgent, touchPoints, expected) => {
    expect(isIosSafari(userAgent, touchPoints)).toBe(expected);
  });
});

describe('installing the app on the phone (F-025)', () => {
  it('offers it once on a card; Install opens the browser’s own dialog and the card goes', async () => {
    const user = userEvent.setup();
    renderApp('/transactions');
    await screen.findByRole('heading', { level: 1, name: 'Transactions' }, LOADED);
    const prompt = offerInstall();

    const offer = await screen.findByRole('region', { name: 'Install the app' });
    expect(within(offer).getByText('Pup Budget on your home screen')).toBeInTheDocument();
    await user.click(within(offer).getByRole('button', { name: 'Install' }));
    const sheet = await screen.findByRole('dialog', { name: 'Install the app' });
    await user.click(within(sheet).getByRole('button', { name: 'Install' }));

    await waitFor(() => {
      expect(prompt).toHaveBeenCalledOnce();
    });
    await waitFor(() => {
      expect(card()).not.toBeInTheDocument();
    });
  });

  it('after Not now keeps it in More, first, and remembers it', async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp('/transactions');
    await screen.findByRole('heading', { level: 1, name: 'Transactions' }, LOADED);
    offerInstall();

    await user.click(
      within(await screen.findByRole('region', { name: 'Install the app' })).getByRole('button', {
        name: 'Not now',
      }),
    );

    expect(await screen.findByText('It’s in More whenever you want it.')).toBeInTheDocument();
    expect(card()).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'More' }));
    const more = await screen.findByRole('dialog', { name: 'More' });
    const [first] = within(more).getAllByRole('button');
    expect(first).toHaveTextContent('Install the appOpens at once from your home screen');
    await user.click(first ?? more);
    expect(await screen.findByRole('dialog', { name: 'Install the app' })).toBeInTheDocument();

    // Opened again: no card, the row stays
    unmount();
    renderApp('/transactions');
    await user.click(await screen.findByRole('button', { name: 'More' }, LOADED));
    expect(
      within(await screen.findByRole('dialog', { name: 'More' })).getByText('Install the app'),
    ).toBeInTheDocument();
    expect(card()).not.toBeInTheDocument();
  });

  it('shows Safari’s three taps on the iPhone, with no Install button', async () => {
    onIosSafari();
    const user = userEvent.setup();
    renderApp('/transactions');

    await user.click(
      within(await screen.findByRole('region', { name: 'Install the app' }, LOADED)).getByRole(
        'button',
        { name: 'Install' },
      ),
    );

    const sheet = await screen.findByRole('dialog', { name: 'Install the app' });
    const steps = within(sheet).getByRole('list', { name: 'In Safari' });
    expect(
      within(steps)
        .getAllByRole('listitem')
        .map((step) => step.textContent),
    ).toEqual(['Tap  in Safari’s bar', 'Tap Share', 'Tap Add to Home Screen, then Add']);
    expect(within(sheet).getByRole('button', { name: 'Got it' })).toBeInTheDocument();
    expect(within(sheet).queryByRole('button', { name: 'Install' })).not.toBeInTheDocument();
  });

  it('offers nothing in a browser that can’t install, as Firefox', async () => {
    const user = userEvent.setup();
    renderApp('/transactions');

    await user.click(await screen.findByRole('button', { name: 'More' }, LOADED));
    const more = await screen.findByRole('dialog', { name: 'More' });

    expect(within(more).getByRole('link', { name: 'Family' })).toBeInTheDocument();
    expect(within(more).queryByText('Install the app')).not.toBeInTheDocument();
    expect(card()).not.toBeInTheDocument();
  });

  it('offers nothing inside the installed app', async () => {
    onIosSafari();
    // Opened from the home screen
    setScreenWidth(375, { standalone: true });
    renderApp('/transactions');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Transactions' }, LOADED),
    ).toBeInTheDocument();
    expect(card()).not.toBeInTheDocument();
  });
});

describe('installing the app on the desktop (F-025)', () => {
  it('has a row in the sidebar where the browser can install it, and no card', async () => {
    setScreenWidth(1280);
    const user = userEvent.setup();
    renderApp('/transactions');
    const sidebar = await screen.findByRole('complementary', { name: 'Sidebar' }, LOADED);
    offerInstall();

    await user.click(await within(sidebar).findByRole('button', { name: 'Install the app' }));

    expect(await screen.findByRole('dialog', { name: 'Install the app' })).toBeInTheDocument();
    expect(card()).not.toBeInTheDocument();
  });

  it('has no row in Safari, which can’t be asked to install', async () => {
    setScreenWidth(1280);
    onIosSafari();
    renderApp('/transactions');

    const sidebar = await screen.findByRole('complementary', { name: 'Sidebar' }, LOADED);
    expect(within(sidebar).getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(
      within(sidebar).queryByRole('button', { name: 'Install the app' }),
    ).not.toBeInTheDocument();
  });
});
