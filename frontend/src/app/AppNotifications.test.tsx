import { notifications } from '@mantine/notifications';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setScreenWidth } from '../test/screen';
import { AppProviders } from './AppProviders';

/** The toasts' container around the one shown (Mantine marks it with its position). */
function showToast() {
  render(
    <AppProviders env="test">
      <div />
    </AppProviders>,
  );
  act(() => {
    notifications.show({ message: 'Expense saved.' });
  });
  return screen.getByText('Expense saved.').closest('[data-position]');
}

describe('AppNotifications (B-013)', () => {
  it('shows the toasts at the top on the phone, clear of the bottom bar', () => {
    expect(showToast()).toHaveAttribute('data-position', 'top-center');
  });

  it('keeps them at the bottom right on the desktop', () => {
    setScreenWidth(1280);
    expect(showToast()).toHaveAttribute('data-position', 'bottom-right');
  });
});
