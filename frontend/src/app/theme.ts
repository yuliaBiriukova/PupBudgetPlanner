import { createTheme, type CSSVariablesResolver, type MantineColorsTuple } from '@mantine/core';

// The single place for theme settings (docs/DESIGN_RULES.md). Colors: "charcoal and sky", chosen in F-010 from the
// prototypes in docs/changes/features/F-010-app-shell/prototypes/blocks.html.

/** Buttons: charcoal in light mode (shade 8), light grey in dark mode (shade 1). */
const charcoal: MantineColorsTuple = [
  '#f2f3f4',
  '#e9eaec',
  '#d3d6da',
  '#b4b9bf',
  '#8b9199',
  '#626872',
  '#474c54',
  '#363a40',
  '#26292e',
  '#1c1e21',
];

/** The logo (shade 4) and the accent that marks the open section (shade 7 light, shade 4 dark). */
const sky: MantineColorsTuple = [
  '#eef6fd',
  '#dcecfa',
  '#bfdcf5',
  '#a5cff1',
  '#8ec1ec',
  '#6aa6dc',
  '#4a89c6',
  '#2a62a3',
  '#1f4c82',
  '#163861',
];

/** Neutral greys for light mode: borders, hovers, inputs. */
const gray: MantineColorsTuple = [
  '#f5f6f7',
  '#ebedf0',
  '#e4e5e6',
  '#d7d8d9',
  '#b4b9bf',
  '#8b9199',
  '#626872',
  '#4a4f56',
  '#363a40',
  '#1c1e21',
];

/** Dark mode surfaces; Mantine uses dark[7] for the page, dark[6] for inputs, dark[4] for borders, dark[0] for text. */
const dark: MantineColorsTuple = [
  '#e9eaec',
  '#c4c6ca',
  '#a4a5a7',
  '#71747b',
  '#37383a',
  '#2e3035',
  '#1b1c1e',
  '#121315',
  '#0d0e0f',
  '#08090a',
];

export const theme = createTheme({
  colors: { charcoal, sky, gray, dark },
  primaryColor: 'charcoal',
  primaryShade: { light: 8, dark: 1 },
  autoContrast: true,
  fontFamily: 'Manrope, system-ui, sans-serif',
  headings: {
    fontFamily: 'Unbounded, system-ui, sans-serif',
    fontWeight: '300',
    sizes: {
      h1: { fontSize: '1.75rem', lineHeight: '1.2' },
    },
  },
  // Restrained weights (DESIGN_RULES custom rules): only 400 and 500 are loaded.
  fontWeights: { regular: '400', medium: '500', bold: '500' },
  // "Round" corners: 12 px for controls, 24 px for sheets and cards.
  radius: { xs: '6px', sm: '8px', md: '12px', lg: '16px', xl: '24px' },
  defaultRadius: 'md',
  cursorType: 'pointer',
  respectReducedMotion: true,
});

/** Colors Mantine has no token for (sidebar, accent, logo), plus the page and text colors of both schemes. */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {
    // Display face for headings, amounts and the app name
    '--pup-font-display': 'Unbounded, system-ui, sans-serif',
  },
  light: {
    '--mantine-color-body': '#f5f6f7',
    '--mantine-color-text': '#1c1e21',
    '--mantine-color-dimmed': '#57585b',
    '--pup-color-sidebar': '#ebedf0',
    '--pup-color-surface': '#fcfcfd',
    '--pup-color-rule': '#d7d8d9',
    '--pup-color-hover': '#e8e9ea',
    '--pup-color-accent': 'var(--mantine-color-sky-7)',
    '--pup-color-active-bg': '#e7ecf1',
    '--pup-color-logo': 'var(--mantine-color-sky-4)',
    '--pup-color-logo-mark': '#1c1e21',
    '--pup-color-tooltip': '#1c1e21',
    '--pup-color-on-tooltip': '#f5f6f7',
    '--pup-shadow-float': '0 8px 24px rgba(15, 17, 20, 0.1)',
  },
  dark: {
    '--mantine-color-body': '#121315',
    '--mantine-color-text': '#e9eaec',
    '--mantine-color-dimmed': '#a4a5a7',
    '--pup-color-sidebar': '#18191b',
    '--pup-color-surface': '#1b1c1e',
    '--pup-color-rule': '#37383a',
    '--pup-color-hover': '#212224',
    '--pup-color-accent': 'var(--mantine-color-sky-4)',
    '--pup-color-active-bg': '#262f37',
    '--pup-color-logo': 'var(--mantine-color-sky-4)',
    '--pup-color-logo-mark': '#121315',
    '--pup-color-tooltip': '#e9eaec',
    '--pup-color-on-tooltip': '#121315',
    '--pup-shadow-float': '0 10px 28px rgba(0, 0, 0, 0.45)',
  },
});
