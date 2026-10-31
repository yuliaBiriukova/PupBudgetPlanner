import {
  Button,
  Checkbox,
  createTheme,
  Input,
  ScrollArea,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from '@mantine/core';
import { SCROLL_BAR_HIDE_DELAY } from '../shared/ui/FadingScrollArea';
import themeClasses from './theme.module.css';

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
  components: {
    // autoContrast picks the text color once, from the light-mode shade, so dark mode got white text on the
    // light button. Filled buttons in the primary color take the text color of the current scheme instead.
    Button: Button.extend({
      vars: (_theme, props) =>
        (props.variant ?? 'filled') === 'filled' && props.color === undefined
          ? { root: { '--button-color': 'var(--pup-color-on-primary)' } }
          : { root: {} },
    }),
    // Fields in focus get a 2 px accent border (theme.module.css): Mantine only changes the border color
    Input: Input.extend({ classNames: { input: themeClasses.input } }),
    // Pup's scroll bar for every scroll area, Mantine's own too (dropdowns): the look is in theme.module.css; it
    // shows while scrolling. Shared areas add the fades with FadingScrollArea (I-004). Autosize takes its own
    // defaults and passes them on, so it needs them too.
    ScrollArea: ScrollArea.extend({
      defaultProps: { type: 'scroll', scrollbarSize: 12, scrollHideDelay: SCROLL_BAR_HIDE_DELAY },
      classNames: { scrollbar: themeClasses.scrollbar, thumb: themeClasses.thumb },
    }),
    ScrollAreaAutosize: ScrollArea.Autosize.extend({
      defaultProps: { type: 'scroll', scrollbarSize: 12, scrollHideDelay: SCROLL_BAR_HIDE_DELAY },
    }),
    // A rounded square (the md default made the 20 px box a circle, like a radio) in the accent, the color of
    // picked rows and the active section
    Checkbox: Checkbox.extend({
      defaultProps: { radius: 'xs' },
      classNames: { input: themeClasses.checkboxInput },
      vars: () => ({
        root: {
          '--checkbox-color': 'var(--pup-color-accent)',
          '--checkbox-icon-color': 'var(--pup-color-surface)',
        },
      }),
    }),
  },
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
    '--pup-color-on-primary': '#f5f6f7',
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
    // Sign-in screens (F-011): the charcoal brand half, the Sign in / Create account switch, field borders (3:1)
    '--pup-color-hero': '#26292e',
    '--pup-color-on-hero': '#f5f6f7',
    '--pup-color-hero-muted': '#b4b9bf',
    '--pup-color-hero-rule': '#474c54',
    '--pup-color-switch': '#ebedf0',
    '--pup-color-switch-active': '#fcfcfd',
    '--pup-shadow-switch': '0 1px 3px rgba(15, 17, 20, 0.14)',
    '--pup-color-field-border': '#7c828a',
    // Errors: field messages and the banner
    '--mantine-color-error': '#b3261e',
    '--pup-color-error-bg': '#fbeceb',
    '--pup-color-error-text': '#8c1d18',
    // Delete buttons (F-028)
    '--pup-color-danger': '#b3261e',
    '--pup-color-danger-hover': '#9c211a',
    '--pup-color-on-danger': '#fcfcfd',
    // Amounts below zero (a debt, an expense), and the tint of a picked or new thing
    '--pup-color-expense': '#b3261e',
    '--pup-color-tint': '#e7ecf1',
    // Income, and the tags of the Categories page (F-015): neutral, income ones green
    '--pup-color-income': '#1f7a4d',
    '--pup-color-income-bg': '#e4f1ea',
    '--pup-color-tag': '#ebedf0',
    // The Solid account card (F-014): charcoal here, light grey in dark mode
    '--pup-card-solid': '#26292e',
    '--pup-card-solid-hover': '#363a40',
    '--pup-card-on-solid': '#f5f6f7',
    '--pup-card-solid-muted': '#b4b9bf',
    '--pup-card-solid-debt': '#f2958c',
  },
  dark: {
    '--mantine-color-body': '#121315',
    '--mantine-color-text': '#e9eaec',
    '--mantine-color-dimmed': '#a4a5a7',
    '--pup-color-on-primary': '#121315',
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
    '--pup-color-hero': '#0b0c0d',
    '--pup-color-on-hero': '#e9eaec',
    '--pup-color-hero-muted': '#a4a5a7',
    '--pup-color-hero-rule': '#2e3035',
    '--pup-color-switch': '#121315',
    '--pup-color-switch-active': '#2e3035',
    '--pup-shadow-switch': 'none',
    '--pup-color-field-border': '#71747b',
    '--mantine-color-error': '#f2958c',
    '--pup-color-error-bg': '#3a1d1b',
    '--pup-color-error-text': '#f6b8b2',
    '--pup-color-danger': '#f2958c',
    '--pup-color-danger-hover': '#f6b8b2',
    '--pup-color-on-danger': '#121315',
    '--pup-color-expense': '#f2958c',
    '--pup-color-tint': '#262f37',
    '--pup-color-income': '#7fd1a4',
    '--pup-color-income-bg': '#1b2d23',
    '--pup-color-tag': '#26272a',
    '--pup-card-solid': '#e9eaec',
    '--pup-card-solid-hover': '#d3d6da',
    '--pup-card-on-solid': '#1c1e21',
    '--pup-card-solid-muted': '#474c54',
    '--pup-card-solid-debt': '#a1221b',
  },
});
