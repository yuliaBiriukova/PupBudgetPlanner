import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { thisMonth } from '../../features/budget/budget';
import { plannedMonth } from '../../features/budget/budgetTestData';
import { MonthHeadPage } from './MonthHeadPage';

/** The Budget page in a scrolling main area (its padding as AppLayout's on the desktop), with a fake API. */
function Screen() {
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
        <main style={{ height: '100dvh', overflow: 'hidden auto' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px 48px' }}>
            <MonthHeadPage />
          </div>
        </main>
      </MockFetch>
    </MemoryRouter>
  );
}

const meta = {
  title: 'Prototypes/F-033 Month head',
  component: Screen,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Screen>;

export default meta;

/** The switcher a band that stays in place, the groups scrolling under it; the month's column as wide as the switcher. */
export const Final: StoryObj<typeof meta> = { name: 'Final: Sticky month band' };
