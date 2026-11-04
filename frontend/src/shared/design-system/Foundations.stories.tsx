import { DEFAULT_THEME, mergeMantineTheme, Text, Title } from '@mantine/core';
import {
  IconChartBar,
  IconListTree,
  IconPlus,
  IconReceipt,
  IconSettings,
  IconUsers,
  IconWallet,
} from '@tabler/icons-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useLayoutEffect, useRef, useState } from 'react';
import { cssVariablesResolver, theme } from '../../app/theme';
import classes from './DesignSystem.module.css';
import { Page, Sample, SchemeColumn, Section, Swatch } from './DesignSystemParts';

// The app's tokens, read from theme.ts, so this page can't drift from the app (I-019).

const merged = mergeMantineTheme(DEFAULT_THEME, theme);
const resolved = cssVariablesResolver(merged);
const charcoal = merged.colors.charcoal;

/** Mantine's primary colour isn't in our resolver: the charcoal shades the theme picks for each scheme. */
const PRIMARY = '--mantine-primary-color-filled';
const schemes: Record<'light' | 'dark', Record<string, string>> = {
  light: { ...resolved.light, [PRIMARY]: charcoal?.[8] ?? '' },
  dark: { ...resolved.dark, [PRIMARY]: charcoal?.[1] ?? '' },
};

const GROUPS: [string, string[]][] = [
  [
    'Page and surfaces',
    [
      '--mantine-color-body',
      '--pup-color-surface',
      '--pup-color-sidebar',
      '--pup-color-rule',
      '--pup-color-hover',
      '--pup-color-tint',
      '--pup-color-active-bg',
    ],
  ],
  ['Text', ['--mantine-color-text', '--mantine-color-dimmed', '--pup-color-on-primary']],
  [
    'Buttons, accent and logo',
    [PRIMARY, '--pup-color-accent', '--pup-color-logo', '--pup-color-logo-mark'],
  ],
  [
    'Money',
    ['--pup-color-income', '--pup-color-income-bg', '--pup-color-expense', '--pup-color-transfer'],
  ],
  [
    'Errors and delete',
    [
      '--mantine-color-error',
      '--pup-color-error-bg',
      '--pup-color-error-text',
      '--pup-color-danger',
      '--pup-color-danger-hover',
      '--pup-color-on-danger',
    ],
  ],
  [
    'Controls',
    [
      '--pup-color-field-border',
      '--pup-color-switch',
      '--pup-color-switch-active',
      '--pup-color-choice',
      '--pup-color-choice-active',
      '--pup-color-tag',
      '--pup-color-tooltip',
      '--pup-color-on-tooltip',
      '--pup-color-fresh',
    ],
  ],
];

/** Every other colour token, grouped by the screen it belongs to; new tokens show up here on their own. */
const listed = new Set(GROUPS.flatMap(([, tokens]) => tokens));
const isColour = (token: string) => !token.includes('shadow') && !token.includes('font');
const rest = Object.keys(schemes.light).filter((token) => !listed.has(token) && isColour(token));
const byScreen: [string, (token: string) => boolean][] = [
  ['Sign-in screens', (token) => token.includes('hero')],
  ['Account cards', (token) => token.startsWith('--pup-card-')],
  ['Transactions page', (token) => /--pup-(slip|heat|color-paper|color-on-heat)/.test(token)],
];
const allScreenGroups: [string, string[]][] = [
  ...byScreen.map(([title, test]): [string, string[]] => [title, rest.filter(test)]),
  ['Other', rest.filter((token) => !byScreen.some(([, test]) => test(token)))],
];
const screenGroups = allScreenGroups.filter(([, tokens]) => tokens.length > 0);

/** Shows `var(--mantine-color-sky-7)` as the shade's hex too. */
function shown(value: string) {
  const [, name = '', shade = ''] = /^var\(--mantine-color-(\w+)-(\d)\)$/.exec(value) ?? [];
  const hex = name ? merged.colors[name]?.[Number(shade)] : undefined;
  return hex ? `${hex} (${name} ${shade})` : value;
}

function Colours() {
  return (
    <Page
      intro={
        <>
          Every colour of the app, in both schemes, read from <code>frontend/src/app/theme.ts</code>
          . Components take colours only from these tokens (DESIGN_RULES §3).
        </>
      }
    >
      {[...GROUPS, ...screenGroups].map(([title, tokens]) => (
        <Section key={title} title={title}>
          <div className={classes.schemes}>
            {(['light', 'dark'] as const).map((scheme) => (
              <SchemeColumn
                key={scheme}
                title={scheme === 'light' ? 'Light' : 'Dark'}
                variables={schemes[scheme]}
              >
                <div className={classes.group}>
                  {tokens.map((token) => (
                    <Swatch key={token} token={token} value={shown(schemes[scheme][token] ?? '')} />
                  ))}
                </div>
              </SchemeColumn>
            ))}
          </div>
        </Section>
      ))}
    </Page>
  );
}

/** The value a CSS property ends up with in the browser (Mantine's sizes are rem with a scale). */
function useComputed(property: 'fontSize' | 'width') {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');
  useLayoutEffect(() => {
    if (ref.current) setValue(getComputedStyle(ref.current)[property]);
  }, [property]);
  return [ref, value] as const;
}

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

function TextSize({ size, weight }: { size: (typeof SIZES)[number]; weight: 400 | 500 }) {
  const [ref, value] = useComputed('fontSize');
  return (
    <Sample spec={`Manrope ${String(weight)} · ${size} · ${value}`}>
      <Text ref={ref} size={size} fw={weight}>
        Groceries, 27 Oct 2026
      </Text>
    </Sample>
  );
}

function Heading({ order }: { order: 1 | 2 | 3 }) {
  const [ref, value] = useComputed('fontSize');
  return (
    <Sample spec={`Unbounded 300 · h${String(order)} · ${value}`}>
      <Title ref={ref} order={order}>
        Transactions
      </Title>
    </Sample>
  );
}

function Type() {
  return (
    <Page
      intro={
        <>
          Two typefaces: Unbounded 300 for headings, amounts and the app name, Manrope 400 and 500
          for everything else. Only these weights are loaded; heavy bold is never used (DESIGN_RULES
          custom rules).
        </>
      }
    >
      <Section title="Headings">
        <div className={classes.samples}>
          <Heading order={1} />
          <Heading order={2} />
          <Heading order={3} />
        </div>
      </Section>
      <Section
        title="Amounts"
        note="The display face with tabular numbers, so the digits line up in lists."
      >
        <Sample spec="Unbounded 300 · 32 px · tabular-nums">
          <span
            style={{
              fontFamily: 'var(--pup-font-display)',
              fontSize: 32,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            −4 312 ₴
          </span>
        </Sample>
      </Section>
      <Section title="Text" note="Regular for reading, medium for labels and buttons.">
        <div className={classes.samples}>
          {SIZES.map((size) => (
            <TextSize key={size} size={size} weight={400} />
          ))}
          <TextSize size="sm" weight={500} />
          <TextSize size="md" weight={500} />
        </div>
      </Section>
    </Page>
  );
}

function SpaceRow({ size }: { size: (typeof SIZES)[number] }) {
  const [ref, value] = useComputed('width');
  return (
    <div className={classes.spaceRow}>
      <span className={classes.spec}>
        {size} · {value}
      </span>
      <div
        ref={ref}
        className={classes.spaceBar}
        style={{ width: `var(--mantine-spacing-${size})` }}
      />
    </div>
  );
}

function CornersAndSpacing() {
  return (
    <Page
      intro={
        <>
          Corners are round: 12 px for controls by default, 24 px for sheets and cards, a pill (999
          px) for buttons, switches and chips. Every size and space is even, and the space inside a
          box is never bigger than its outer padding (DESIGN_RULES custom rules).
        </>
      }
    >
      <Section title="Corners">
        <div className={classes.tiles}>
          {SIZES.map((size) => (
            <div key={size} className={classes.tile}>
              <div
                className={classes.cornerBox}
                style={{ borderRadius: `var(--mantine-radius-${size})` }}
              />
              <span className={classes.spec}>
                {size} · {merged.radius[size]}
              </span>
            </div>
          ))}
          <div className={classes.tile}>
            <div className={classes.cornerBox} style={{ borderRadius: 999 }} />
            <span className={classes.spec}>pill · 999px</span>
          </div>
        </div>
      </Section>
      <Section
        title="Spacing"
        note="Mantine's spacing scale; the app's CSS also uses its own even values (2, 4, 6, 8 … px)."
      >
        <div className={classes.samples}>
          {SIZES.map((size) => (
            <SpaceRow key={size} size={size} />
          ))}
        </div>
      </Section>
    </Page>
  );
}

const ICONS = [
  IconReceipt,
  IconWallet,
  IconChartBar,
  IconListTree,
  IconUsers,
  IconSettings,
  IconPlus,
];

function Icons() {
  return (
    <Page
      intro={
        <>
          Tabler icons in three sizes, 16, 20 and 24 px, always with a 1.7 stroke (I-019): 20 px in
          buttons, rows and the sidebar, 24 px in the phone&apos;s tab bar and on the keypad, 16 px
          next to small text.
        </>
      }
    >
      {([16, 20, 24] as const).map((size) => (
        <Section key={size} title={`${String(size)} px`}>
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {ICONS.map((Icon, index) => (
              <Icon key={index} size={size} stroke={1.7} aria-hidden />
            ))}
          </span>
        </Section>
      ))}
    </Page>
  );
}

const meta = {
  title: 'Design system/Foundations',
  parameters: {
    docs: {
      description: {
        component:
          'The tokens every screen is built from: colours, type, corners, spacing and icons (I-019).',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** Both schemes side by side, whatever the toolbar says. */
export const ColourTokens: Story = { render: () => <Colours /> };

export const Typography: Story = { render: () => <Type /> };

export const CornersAndSpaces: Story = { render: () => <CornersAndSpacing /> };

export const IconSizes: Story = { render: () => <Icons /> };
