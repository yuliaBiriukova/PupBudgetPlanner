import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render';

describe('HomePage', () => {
  it('shows the app name', async () => {
    renderApp('/');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pup Budget Planner' }),
    ).toBeInTheDocument();
  });

  it('switches between light and dark mode', async () => {
    const user = userEvent.setup();
    renderApp('/');

    await user.click(await screen.findByRole('button', { name: 'Switch to dark mode' }));

    expect(await screen.findByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-mantine-color-scheme', 'dark');
  });
});
