import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { thisMonth } from '../../features/budget/budget';
import { plannedMonth } from '../../features/budget/budgetTestData';
import { LeftColumnPage, type Panel } from './LeftColumnPage';
import { Both, NotInThePlan, RunningOut, WhereItGoes } from './Panels';

/** F-033, owner's review of PR #115, point 6: what fills the desktop's column under the month. */
function Screen({ panel }: { panel: Panel }) {
  const routes: MockRoutes = {
    '/api/budget': (_, query) => ({ json: plannedMonth(query.get('month') ?? thisMonth()) }),
    'PUT /api/budget/{part}': { status: 204 },
    'PUT /api/budget/{part}/{id}': { status: 204 },
    'DELETE /api/budget': { status: 204 },
    '/api/push/key': { json: { publicKey: null } },
  };
  return (
    <MemoryRouter initialEntries={['/budget']}>
      <MockFetch routes={routes}>
        <main style={{ padding: '28px 40px 48px', maxWidth: 1280, margin: '0 auto' }}>
          <LeftColumnPage panel={panel} />
        </main>
      </MockFetch>
    </MemoryRouter>
  );
}

const meta = {
  title: 'Prototypes/F-033 Left column',
  component: Screen,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Screen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Spending in categories without a budget, biggest first; a row opens New budget in its group. */
export const NotInThePlanStory: Story = {
  name: 'Variant 1: Not in the plan',
  args: { panel: NotInThePlan },
};

/** The four categories over or closest to their budget, each with its bar; a row opens its dialog. */
export const RunningOutStory: Story = {
  name: 'Variant 2: Running out',
  args: { panel: RunningOut },
};

/** The total as one bar split by the groups' budgets, with each group's share; a row scrolls to its group. */
export const WhereItGoesStory: Story = {
  name: 'Variant 3: Where the total goes',
  args: { panel: WhereItGoes },
};

/** Final: where the total goes, then the spending outside the plan (variants 3 and 1 together). */
export const FinalStory: Story = {
  name: 'Final: Where it goes and not in the plan',
  args: { panel: Both },
};
