import type { Category, CategoryGroup, CategoryKind } from './categoriesApi';

/** The shown groups of one kind, in order. */
export const groupsOf = (groups: readonly CategoryGroup[], kind: CategoryKind) =>
  groups.filter((group) => group.kind === kind && !group.isHidden);

export const shownOf = (group: CategoryGroup) =>
  group.categories.filter((category) => !category.isHidden);

export const hiddenOf = (group: CategoryGroup) =>
  group.categories.filter((category) => category.isHidden);

/** Where a category is, with its group. */
export function findCategory(groups: readonly CategoryGroup[], categoryId: string) {
  for (const group of groups) {
    const category = group.categories.find((c) => c.id === categoryId);
    if (category) return { group, category };
  }
  return undefined;
}

/** What removing a category does: deleted when it has no transactions, otherwise hidden (F-029). */
export function removeOutcome(category: Category): 'delete' | 'hide' {
  return category.transactionCount === 0 ? 'delete' : 'hide';
}

export type GroupRemoval =
  { can: 'delete' | 'hide' } | { cannot: 'inUse'; shown: number } | { cannot: 'last' };

/**
 * A group goes once none of its categories is shown: deleted when it has none, hidden when only hidden ones are left.
 * The only shown group of its kind stays.
 */
export function groupRemoval(group: CategoryGroup, groups: readonly CategoryGroup[]): GroupRemoval {
  if (groupsOf(groups, group.kind).length <= 1) return { cannot: 'last' };
  const shown = shownOf(group).length;
  if (shown > 0) return { cannot: 'inUse', shown };
  return { can: group.categories.length === 0 ? 'delete' : 'hide' };
}

/** Two names are one when they differ only in case or in spaces around them, in any alphabet (as the API). */
export const sameName = (a: string, b: string) =>
  a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

/** A name check: empty, or the same name in the same place (hidden ones count). */
export type NameCheck =
  | { ok: true }
  | { ok: false; error: 'empty' }
  | { ok: false; error: 'taken'; twin: string }
  | { ok: false; error: 'takenHidden'; twin: Category };

/** Category names are unique per group; `selfId` is the one being changed. */
export function checkCategoryName(name: string, group: CategoryGroup, selfId?: string): NameCheck {
  if (!name.trim()) return { ok: false, error: 'empty' };
  const twin = group.categories.find((c) => c.id !== selfId && sameName(c.name, name));
  if (!twin) return { ok: true };
  return twin.isHidden
    ? { ok: false, error: 'takenHidden', twin }
    : { ok: false, error: 'taken', twin: twin.name };
}

/** Group names are unique per person, hidden groups too. */
export function checkGroupName(
  name: string,
  groups: readonly CategoryGroup[],
  selfId?: string,
): NameCheck {
  if (!name.trim()) return { ok: false, error: 'empty' };
  const twin = groups.find((g) => g.id !== selfId && sameName(g.name, name));
  return twin ? { ok: false, error: 'taken', twin: twin.name } : { ok: true };
}
