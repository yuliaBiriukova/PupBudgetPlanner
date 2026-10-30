import { SimpleGrid } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AccountCard, AddCard } from './AccountCard';
import { CARD_STYLES } from './accountsApi';

const meta = {
  title: 'Accounts/Account card',
  component: AccountCard,
  args: {
    name: 'Mono black',
    meta: 'Monobank',
    balance: 48211,
    currency: 'UAH',
    cardStyle: 'Solid',
    onClick: fn(),
  },
} satisfies Meta<typeof AccountCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Solid: Story = {};

/** A debt: a true minus, in red that reads on the card. */
export const SolidDebt: Story = { args: { name: 'Mono credit', balance: -4312 } };

export const SolidDark: Story = { globals: { colorScheme: 'dark' } };

/** Every style, light and a debt, as the page shows them side by side. */
function AllStyles() {
  return (
    <SimpleGrid cols={2} spacing={14}>
      {CARD_STYLES.flatMap((style) => [
        <AccountCard
          key={style}
          name={`${style} card`}
          meta="PrivatBank"
          balance={12784}
          currency="UAH"
          cardStyle={style}
        />,
        <AccountCard
          key={`${style}-debt`}
          name="A long name that ends in an ellipsis on the card"
          code="USD"
          balance={-1240}
          currency="USD"
          cardStyle={style}
        />,
      ])}
      <AddCard label="Add UAH account" onClick={fn()} />
    </SimpleGrid>
  );
}

export const Styles: Story = { render: () => <AllStyles /> };

export const StylesDark: Story = {
  render: () => <AllStyles />,
  globals: { colorScheme: 'dark' },
};
