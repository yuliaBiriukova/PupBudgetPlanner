import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { AmountDisplay } from './AmountDisplay';
import type { TransactionType } from './transactionsApi';

interface DisplayProps {
  value: string;
  currency: string;
  type?: TransactionType;
  label?: string;
  secondary?: boolean;
}

/** One display, typed into as in the form. */
function Display({ value: start, currency, type = 'Expense', label, secondary }: DisplayProps) {
  const [value, setValue] = useState(start);
  return (
    <AmountDisplay
      value={value}
      onChange={setValue}
      type={type}
      currency={currency}
      withKeys={false}
      onEnter={() => undefined}
      label={label}
      secondary={secondary}
    />
  );
}

/**
 * The amounts whose digits are narrow in the display font (`1`, `4`) and the signs on both sides of the number (B-006):
 * each number fits its box, the sign clear of it; a wide one, nothing typed, a sum, an exchange's two amounts.
 */
function Amounts() {
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 440, padding: 16 }}>
      <Display value="135" currency="UAH" />
      <Display value="414" currency="USD" />
      <Display value="1250000" currency="UAH" type="Income" />
      <Display value="" currency="EUR" />
      <Display value="100+35" currency="UAH" />
      <Display value="414" currency="USD" type="Transfer" label="From Mono dollars" />
      <Display value="18849" currency="UAH" type="Transfer" label="To Mono black" secondary />
    </div>
  );
}

const meta = {
  title: 'Transactions/Amount display',
  component: Amounts,
} satisfies Meta<typeof Amounts>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every number fits its box: the input never scrolls its text under the sign. */
export const SignsClearOfTheNumber: Story = {
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    for (const input of Array.from(canvasElement.querySelectorAll('input'))) {
      await expect(input.scrollWidth).toBeLessThanOrEqual(input.clientWidth);
    }
  },
};

export const SignsClearOfTheNumberDark: Story = {
  ...SignsClearOfTheNumber,
  globals: { colorScheme: 'dark' },
};

export const SignsClearOfTheNumberDesktop: Story = {
  ...SignsClearOfTheNumber,
  globals: { viewport: { value: 'desktop', isRotated: false } },
};
