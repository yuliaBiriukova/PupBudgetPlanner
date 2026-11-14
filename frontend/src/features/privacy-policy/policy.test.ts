import { describe, expect, it } from 'vitest';
import en from '../../shared/i18n/locales/en.json';
import { contactEmail, formatLongDate, SECTION_IDS } from './policy';

describe('the privacy policy', () => {
  it('takes the contact address from the build setting, trimmed, or nothing', () => {
    expect(contactEmail({ VITE_CONTACT_EMAIL: '  pup@example.com ' })).toBe('pup@example.com');
    expect(contactEmail({ VITE_CONTACT_EMAIL: '' })).toBe('');
    expect(contactEmail({})).toBe('');
  });

  it('writes its date out', () => {
    expect(formatLongDate('2026-11-14')).toBe('14 November 2026');
  });

  it('has a text for every section the page shows, and no other', () => {
    expect(Object.keys(en.privacyPolicy.sections).sort()).toEqual([...SECTION_IDS].sort());
  });
});
