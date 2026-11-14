// The privacy policy's sections and settings (F-031). The text is in en.json (`privacyPolicy`) and in
// docs/changes/features/F-031-privacy-policy/privacy-policy.md; the two change together.

/** When the policy last changed: shown at its top; a change to the text moves it. */
export const POLICY_UPDATED = '2026-11-15';

/** The sections in the order the page shows them. */
export const SECTION_IDS = [
  'what',
  'why',
  'who',
  'where',
  'protected',
  'howLong',
  'choices',
  'changes',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/** A line of a list: an optional lead in medium weight, then the text. */
export interface PolicyItem {
  lead?: string;
  text?: string;
}

/** A part of a section: a small heading, a paragraph or a list. */
export interface PolicyBlock {
  heading?: string;
  text?: string;
  items?: readonly PolicyItem[];
}

export interface PolicySection {
  title: string;
  blocks: readonly PolicyBlock[];
}

/**
 * The address people write to about their data: the `VITE_CONTACT_EMAIL` build setting (Render), so the owner's address
 * stays out of the repository. Empty when it isn't set (local builds, CI).
 */
export function contactEmail(env: { VITE_CONTACT_EMAIL?: string } = import.meta.env): string {
  return env.VITE_CONTACT_EMAIL?.trim() ?? '';
}

const LONG_DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** `14 November 2026`: a document's date, written out. */
export function formatLongDate(isoDate: string): string {
  return LONG_DATE.format(new Date(isoDate));
}

/** The id of a section's element on the page (its link in the contents). */
export const sectionElementId = (id: SectionId) => `privacy-${id}`;
