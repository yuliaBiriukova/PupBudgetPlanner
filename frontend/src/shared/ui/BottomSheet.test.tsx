import { TextInput } from '@mantine/core';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { BottomSheet } from './BottomSheet';

/** jsdom's screen: 768 px tall. */
const SCREEN = window.innerHeight;
const KEYBOARD = 300;

/** The phone's visual viewport, which jsdom doesn't have: the keyboard takes its bottom 300 px (I-017). */
const viewport = Object.assign(new EventTarget(), { height: SCREEN, offsetTop: 0, scale: 1 });

function keyboard(up: boolean) {
  viewport.height = up ? SCREEN - KEYBOARD : SCREEN;
  act(() => {
    viewport.dispatchEvent(new Event('resize'));
  });
}

/** Two frames: the sheet takes its height above the keyboard before the field is scrolled into sight. */
async function twoFrames() {
  await act(async () => {
    await new Promise<void>((done) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          done();
        });
      });
    });
  });
}

function renderSheet() {
  render(
    <AppProviders env="test">
      <BottomSheet opened onClose={vi.fn()} title="Rename the account">
        <TextInput label="Name" description="As you call it" />
      </BottomSheet>
    </AppProviders>,
  );
  return screen.getByRole('dialog', { name: 'Rename the account' });
}

beforeEach(() => {
  viewport.height = SCREEN;
  Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window, 'visualViewport');
});

describe('BottomSheet height and keyboard (I-029)', () => {
  it('sits on the phone’s keyboard, whatever the sheet, and goes back down with it', () => {
    const sheet = renderSheet();
    expect(sheet).not.toHaveAttribute('data-keyboard');

    keyboard(true);
    expect(sheet).toHaveAttribute('data-keyboard');
    expect(sheet.style.getPropertyValue('--sheet-visible-height')).toBe(
      `${String(SCREEN - KEYBOARD)}px`,
    );
    expect(sheet.style.getPropertyValue('--sheet-keyboard')).toBe(`${String(KEYBOARD)}px`);

    keyboard(false);
    expect(sheet).not.toHaveAttribute('data-keyboard');
  });

  it('scrolls the field being typed into sight once the keyboard is up: its label and hint too', async () => {
    const sheet = renderSheet();
    const name = screen.getByLabelText('Name');
    // The sheet takes the focus itself as it opens; the tap on the field comes after
    await waitFor(() => {
      expect(sheet).toContainElement(document.activeElement as HTMLElement);
    });
    act(() => {
      name.focus();
    });
    expect(name).toHaveFocus();
    const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView');
    scrolled.mockClear();

    keyboard(true);
    await twoFrames();

    expect(scrolled).toHaveBeenCalledWith({ block: 'nearest' });
    const field = scrolled.mock.contexts[0] as HTMLElement;
    expect(sheet).toContainElement(field);
    expect(field).toContainElement(name);
    expect(field).toHaveTextContent('As you call it');
  });

  it('leaves the content alone while no field is typed', async () => {
    renderSheet();
    const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView');
    act(() => {
      screen.getByRole('button', { name: 'Close' }).focus();
    });
    scrolled.mockClear();

    keyboard(true);
    await twoFrames();

    expect(scrolled).not.toHaveBeenCalled();
  });
});
