import type { Meta, StoryObj } from '@storybook/react-vite';
import { PrototypeScreens, type Start, type VariantParts } from './Frame';
import * as variant1 from './Variant1';
import * as variant2 from './Variant2';
import * as variant3 from './Variant3';

const VARIANTS = { variant1, variant2, variant3 } satisfies Record<string, VariantParts>;

interface ScreensProps {
  variant: keyof typeof VARIANTS;
  /** Where it opens: the privacy page, or a page with the link to it. */
  start: Start;
}

function Screens({ variant, start }: ScreensProps) {
  return <PrototypeScreens key={`${variant}-${start}`} parts={VARIANTS[variant]} start={start} />;
}

const meta = {
  title: 'Prototypes/F-031 Privacy policy',
  component: Screens,
  parameters: { layout: 'fullscreen' },
  args: { variant: 'variant1', start: 'privacy' },
  argTypes: {
    variant: { table: { disable: true } },
    start: { control: 'inline-radio', options: ['privacy', 'sign-in', 'sign-up', 'settings'] },
  },
} satisfies Meta<typeof Screens>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The page in the sign-in screens' frame: the promises on the charcoal half, the text beside them. */
export const Variant1: Story = {
  name: 'Variant 1: In the sign-in frame',
  args: { variant: 'variant1' },
};

/** A document page: the app's top line, the contents beside the text on the desktop, folded on the phone. */
export const Variant2: Story = {
  name: 'Variant 2: A document with contents',
  args: { variant: 'variant2' },
};

/** Answers first: one sentence that says it all, then the questions people ask, each opening its full answer. */
export const Variant3: Story = {
  name: 'Variant 3: Answers first',
  args: { variant: 'variant3' },
};
