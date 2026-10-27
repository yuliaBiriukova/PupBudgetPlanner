import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';

describe('NotFoundPage', () => {
  it('is shown for an unknown address and links back home', async () => {
    const user = userEvent.setup();
    renderApp('/no-such-page');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Go to the home page' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Transactions' }),
    ).toBeInTheDocument();
  });
});
