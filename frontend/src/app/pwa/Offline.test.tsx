import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOADED, renderApp } from '../../test/render';
import { AppProviders } from '../AppProviders';
import { StartupScreen } from '../StartupScreen';
import { answerTransactionsPage } from './pwaTestApi';
import { UpdateNotice } from './UpdateNotice';
import { resetUpdateForTests, updateReady } from './updates';

/** The network goes or comes back, as the browser tells the page. */
function setOnline(online: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
  act(() => {
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
  });
}

beforeEach(() => {
  answerTransactionsPage();
});

afterEach(() => {
  setOnline(true);
  act(() => {
    resetUpdateForTests();
  });
});

describe('without a network (F-025)', () => {
  it('says so at the top of the app, and stops saying it once the network is back', async () => {
    renderApp('/transactions');
    await screen.findByRole('heading', { level: 1, name: 'Transactions' }, LOADED);

    setOnline(false);

    expect(screen.getByText('No connection: you can look, not save')).toBeInTheDocument();

    setOnline(true);

    await waitFor(() => {
      expect(screen.queryByText('No connection: you can look, not save')).not.toBeInTheDocument();
    });
  });

  it('says the phone is offline on the start screen, with Try again', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    render(
      <AppProviders env="test">
        <StartupScreen />
      </AppProviders>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'You’re offline.Pup Budget opens once the phone is online again.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('says the server didn’t answer when the network is there', () => {
    render(
      <AppProviders env="test">
        <StartupScreen failed onRetry={vi.fn()} />
      </AppProviders>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t reach the server.');
  });
});

describe('after a release (F-025)', () => {
  it('shows "A new version is ready" until Reload, which brings the new version', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    render(
      <AppProviders env="test">
        <UpdateNotice />
      </AppProviders>,
    );

    act(() => {
      updateReady(reload);
    });

    expect(await screen.findByText('A new version is ready.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reload' }));
    expect(reload).toHaveBeenCalledOnce();
  });
});
