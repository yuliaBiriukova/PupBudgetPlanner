import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router';
import { expect, userEvent, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { shiftMonth, thisMonth } from './budget';
import { BudgetPage } from './BudgetPage';
import { notPlannedMonth, plannedMonth } from './budgetTestData';
import { PushPreview, ReminderBanner } from './Reminder';

interface BudgetProps {
  /** `planned`: the final prototype's month; `next`: next month, not planned; `new`: never planned anything. */
  data?: 'planned' | 'next' | 'new' | 'loading' | 'error';
}

/** The Budget page (F-033) with a fake API. */
function BudgetScreen({ data = 'planned' }: BudgetProps) {
  const month = thisMonth();
  const routes: MockRoutes = {
    '/api/budget':
      data === 'loading'
        ? 'pending'
        : data === 'error'
          ? { status: 500 }
          : (_, query) => {
              const asked = query.get('month') ?? month;
              return {
                json:
                  data === 'planned' && asked <= month
                    ? plannedMonth(asked)
                    : notPlannedMonth(asked, data === 'new' ? null : month),
              };
            },
    'PUT /api/budget/{part}': { status: 204 },
    'PUT /api/budget/{part}/{id}': { status: 204 },
    'POST /api/budget/start': { status: 204 },
    'DELETE /api/budget': { status: 204 },
    // Storybook has no service worker: the reminder's card stays away, as in a browser without push
    '/api/push/key': { json: { publicKey: null } },
  };
  const search = data === 'next' ? `?month=${shiftMonth(month, 1)}` : '';
  return (
    <MemoryRouter initialEntries={[`/budget${search}`]}>
      <MockFetch routes={routes}>
        <main>
          <BudgetPage />
        </main>
      </MockFetch>
    </MemoryRouter>
  );
}

const desktop = { viewport: { value: 'desktop', isRotated: false } };

const meta = {
  title: 'Budget/Budget page',
  component: BudgetScreen,
  args: {},
} satisfies Meta<typeof BudgetScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The phone: what's left of the month big with its bar, then the groups one under the other. */
export const Phone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('month-left')).toHaveTextContent('18 518 ₴');
    await expect(canvas.getByRole('region', { name: 'Daily living' })).toHaveTextContent(
      '607 ₴ over',
    );
  },
};

/** The desktop: the month in a sticky column on the left, the groups on the right. */
export const Desktop: Story = { globals: desktop };

/** A category's dialog with an amount that doesn't fit its group: Save is blocked with what goes over. */
export const DialogBlocked: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /^Eating out/ }));
    const dialog = within(canvasElement.ownerDocument.body).getByRole('dialog', {
      name: 'Eating out',
    });
    const field = within(dialog).getByRole('textbox');
    await userEvent.clear(field);
    await userEvent.type(field, '9000');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await expect(within(dialog).getByRole('alert')).toBeInTheDocument();
  },
};

/** Delete the month's plan (owner's review of PR #115): it asks first. */
export const DeletePlan: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByTestId('month-left');
    const [button] = canvas.getAllByRole('button', { name: /^Delete .*’s plan$/ });
    if (button) await userEvent.click(button);
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', {
        name: /^Delete .*’s plan\?$/,
      }),
    ).toBeInTheDocument();
  },
};

/** Next month, not planned yet: start it from this month's plan, or empty. */
export const NotPlanned: Story = { args: { data: 'next' } };

/** Someone who has never planned a month: only Start empty. */
export const NeverPlanned: Story = { args: { data: 'new' } };

export const Loading: Story = { args: { data: 'loading' } };

export const CouldNotLoad: Story = { args: { data: 'error' } };

/** The banner over the other pages while this month isn't planned (here over an empty page). */
export const Banner: StoryObj = {
  render: () => (
    <MemoryRouter initialEntries={['/transactions']}>
      <MockFetch
        routes={{
          '/api/budget': { json: notPlannedMonth(thisMonth(), shiftMonth(thisMonth(), -1)) },
        }}
      >
        <Routes>
          <Route path="*" element={<ReminderBanner />} />
        </Routes>
      </MockFetch>
    </MemoryRouter>
  ),
};

/** The reminder on the 1st as a phone shows it: the picture on the Budget page's card. */
export const Notification: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <PushPreview />
    </div>
  ),
};
