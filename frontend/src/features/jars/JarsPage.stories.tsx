import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { expect, userEvent, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { JarsPage } from './JarsPage';
import { JARS, OVERVIEW_WITH_JARS, TOTAL_WITH_JARS } from './jarsTestData';

interface JarsProps {
  /** `jars`: the final prototype's five jars; `none`: someone without jars yet. */
  data?: 'jars' | 'none' | 'loading' | 'error';
}

/** The Jars page (F-034) with a fake API: Olena's accounts and jars. */
function JarsScreen({ data = 'jars' }: JarsProps) {
  const routes: MockRoutes = {
    '/api/jars':
      data === 'loading'
        ? 'pending'
        : data === 'error'
          ? { status: 500 }
          : { json: data === 'none' ? [] : JARS },
    '/api/accounts': { json: OVERVIEW_WITH_JARS },
    '/api/accounts/total': {
      json: data === 'none' ? { ...TOTAL_WITH_JARS, inJars: 0 } : TOTAL_WITH_JARS,
    },
    '/api/rates': {
      json: { date: '2026-10-30', status: 'Current', rates: [{ currency: 'USD', rate: 41.35 }] },
    },
    'POST /api/jars': { json: JARS[0] },
    'PUT /api/jars/{id}': { json: JARS[0] },
    'POST /api/jars/{id}/moves': { json: JARS[0] },
    'POST /api/jars/{id}/close': { status: 204 },
  };
  return (
    <MemoryRouter initialEntries={['/jars']}>
      <MockFetch routes={routes}>
        <main>
          <JarsPage />
        </main>
      </MockFetch>
    </MemoryRouter>
  );
}

const desktop = { viewport: { value: 'desktop', isRotated: false } };

const meta = {
  title: 'Jars/Jars page',
  component: JarsScreen,
  args: {},
} satisfies Meta<typeof JarsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The phone: what is set aside and free, the jars on a shelf, where the jar money lies. */
export const Phone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findAllByTestId('jar-tile')).toHaveLength(5);
  },
};

export const Desktop: Story = { globals: desktop };

/** A jar opened: its goal, pace, this month's plan, where it lies and its history. */
export const JarWindow: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [car] = await canvas.findAllByTestId('jar-tile');
    if (car) await userEvent.click(car);
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Car' }),
    ).toBeInTheDocument();
  },
};

/** Put in from an account: the quick-add form's amount display and account field. */
export const PutIn: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Put in Car' }));
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Put into Car' }),
    ).toBeInTheDocument();
  },
};

/** New jar: name, icon, colour, currency, goal, month and note. */
export const NewJar: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findAllByTestId('jar-tile');
    const [button] = canvas.getAllByRole('button', { name: 'New jar' });
    if (button) await userEvent.click(button);
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'New jar' }),
    ).toBeInTheDocument();
  },
};

/** Someone without jars: the dashed New jar and a line on what a jar is. */
export const Empty: Story = { args: { data: 'none' } };

export const Loading: Story = { args: { data: 'loading' } };

export const CouldNotLoad: Story = { args: { data: 'error' } };
