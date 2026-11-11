import { describe, expect, it } from 'vitest';
import type { CategoryGroup } from './categoriesApi';
import { EDITED_CATEGORIES } from './categoriesTestData';
import { checkCategoryName, checkGroupName, groupRemoval, removeOutcome } from './categoryRules';

const GROUPS = EDITED_CATEGORIES.groups;
function group(name: string): CategoryGroup {
  const found = GROUPS.find((g) => g.name === name);
  if (!found) throw new Error(`No group ${name}`);
  return found;
}

describe('the rules for changing categories (F-029)', () => {
  it('delete a category nobody used and hide one with transactions', () => {
    const spotify = { id: 'spotify', name: 'Spotify', isHidden: false, transactionCount: 12 };
    expect(removeOutcome(spotify)).toBe('hide');
    expect(removeOutcome({ ...spotify, transactionCount: 0 })).toBe('delete');
  });

  it('let a group go only without shown categories, and never the last of its kind', () => {
    const empty: CategoryGroup = {
      id: 'pets',
      name: 'Pets',
      kind: 'Expense',
      isHidden: false,
      categories: [],
    };
    const onlyHidden: CategoryGroup = { ...group('Car'), isHidden: false };

    expect(groupRemoval(group('Health'), GROUPS)).toEqual({ cannot: 'inUse', shown: 4 });
    expect(groupRemoval(group('Income'), GROUPS)).toEqual({ cannot: 'last' });
    expect(groupRemoval(empty, [...GROUPS, empty])).toEqual({ can: 'delete' });
    expect(groupRemoval(onlyHidden, [...GROUPS, onlyHidden])).toEqual({ can: 'hide' });
  });

  it('find a name in use ignoring case and spaces, a hidden one named so', () => {
    const subscriptions = group('Subscriptions');

    expect(checkCategoryName('  ', subscriptions)).toEqual({ ok: false, error: 'empty' });
    expect(checkCategoryName(' PHONE ', subscriptions)).toEqual({
      ok: false,
      error: 'taken',
      twin: 'Phone',
    });
    expect(checkCategoryName('netflix', subscriptions)).toMatchObject({ error: 'takenHidden' });
    expect(checkCategoryName('Phone', subscriptions, 'group-7-2')).toEqual({ ok: true });
    expect(checkCategoryName('Rent', subscriptions)).toEqual({ ok: true });
  });

  it('keep group names unique per person, hidden groups too, in any alphabet', () => {
    const withUkrainian = [...GROUPS, { ...group('Car'), id: 'dim', name: 'Дім' }];

    expect(checkGroupName('car', GROUPS)).toEqual({ ok: false, error: 'taken', twin: 'Car' });
    expect(checkGroupName('ДІМ', withUkrainian)).toMatchObject({ error: 'taken' });
    expect(checkGroupName('Health', GROUPS, 'group-4')).toEqual({ ok: true });
  });
});
