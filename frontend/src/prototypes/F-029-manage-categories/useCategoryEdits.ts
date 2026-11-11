import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import type { CategoryKind } from '../../features/categories/categoriesApi';
import { protoGroups, type ProtoCategory, type ProtoGroup } from './protoData';

/** What removing a category does: deleted when it has no transactions, otherwise hidden (F-029). */
export function removeOutcome(category: ProtoCategory): 'delete' | 'hide' {
  return category.used === 0 ? 'delete' : 'hide';
}

export type GroupRemoval =
  { can: 'delete' | 'hide' } | { cannot: 'inUse'; shown: number } | { cannot: 'last' };

/** A group goes once none of its categories is in use: deleted if empty, hidden if only hidden ones are left. */
export function groupRemoval(group: ProtoGroup, groups: ProtoGroup[]): GroupRemoval {
  const sameKind = groups.filter((g) => g.kind === group.kind && !g.hidden);
  if (sameKind.length <= 1) return { cannot: 'last' };
  const shown = group.categories.filter((c) => !c.hidden).length;
  if (shown > 0) return { cannot: 'inUse', shown };
  return { can: group.categories.length === 0 ? 'delete' : 'hide' };
}

export const kindWord = (kind: CategoryKind) => (kind === 'Income' ? 'income' : 'expense');

/** A name check: empty, or the same name in the same place (hidden ones count). */
export type NameCheck = { ok: true } | { ok: false; error: string; hiddenTwin?: ProtoCategory };

export function checkCategoryName(name: string, group: ProtoGroup, selfId?: string): NameCheck {
  const clean = name.trim();
  if (!clean) return { ok: false, error: 'Type a name' };
  const twin = group.categories.find(
    (c) => c.id !== selfId && c.name.toLowerCase() === clean.toLowerCase(),
  );
  if (!twin) return { ok: true };
  if (twin.hidden)
    return {
      ok: false,
      error: `“${twin.name}” is already in ${group.name}, hidden`,
      hiddenTwin: twin,
    };
  return { ok: false, error: `“${twin.name}” is already in ${group.name}` };
}

export function checkGroupName(name: string, groups: ProtoGroup[], selfId?: string): NameCheck {
  const clean = name.trim();
  if (!clean) return { ok: false, error: 'Type a name' };
  const twin = groups.find((g) => g.id !== selfId && g.name.toLowerCase() === clean.toLowerCase());
  return twin ? { ok: false, error: `You already have a group “${twin.name}”` } : { ok: true };
}

let nextId = 1;
const newId = (prefix: string) => `${prefix}-new-${String(nextId++)}`;

function toast(message: string) {
  notifications.show({ message, autoClose: 2500 });
}

/**
 * The prototype's whole set and every change to it, kept in the story (nothing is saved). Each change shows the
 * toast the real page would.
 */
export function useCategoryEdits() {
  const [groups, setGroups] = useState(protoGroups);

  const update = (fn: (groups: ProtoGroup[]) => ProtoGroup[]) => {
    setGroups((current) => fn(structuredClone(current)));
  };
  const find = (categoryId: string) => {
    for (const group of groups) {
      const category = group.categories.find((c) => c.id === categoryId);
      if (category) return { group, category };
    }
    return undefined;
  };

  return {
    groups,
    find,

    addCategory(groupId: string, name: string, index?: number) {
      const id = newId('cat');
      update((all) => {
        const group = all.find((g) => g.id === groupId);
        const category = { id, name: name.trim(), used: 0, year: 0, hidden: false };
        if (!group) return all;
        const shown = group.categories.filter((c) => !c.hidden).length;
        group.categories.splice(index ?? shown, 0, category);
        return all;
      });
      toast(`“${name.trim()}” added`);
      return id;
    },

    renameCategory(categoryId: string, name: string) {
      update((all) => {
        for (const g of all)
          for (const c of g.categories) if (c.id === categoryId) c.name = name.trim();
        return all;
      });
    },

    /** Moves a category to a place among the shown ones of a group (the same or another of its kind). */
    moveCategory(categoryId: string, toGroupId: string, toIndex: number) {
      const from = find(categoryId);
      update((all) => {
        let moving: ProtoCategory | undefined;
        for (const g of all) {
          const at = g.categories.findIndex((c) => c.id === categoryId);
          if (at >= 0) [moving] = g.categories.splice(at, 1);
        }
        const target = all.find((g) => g.id === toGroupId);
        if (!moving || !target) return all;
        target.categories.splice(Math.max(0, toIndex), 0, moving);
        return all;
      });
      const to = groups.find((g) => g.id === toGroupId);
      if (from && to && from.group.id !== to.id)
        toast(`“${from.category.name}” moved to ${to.name}`);
    },

    removeCategory(categoryId: string) {
      const found = find(categoryId);
      if (!found) return;
      const outcome = removeOutcome(found.category);
      update((all) =>
        all.map((g) => ({
          ...g,
          categories:
            outcome === 'delete'
              ? g.categories.filter((c) => c.id !== categoryId)
              : // A hidden one goes to the group's foot, after the shown ones
                [
                  ...g.categories.filter((c) => c.id !== categoryId),
                  ...g.categories
                    .filter((c) => c.id === categoryId)
                    .map((c) => ({ ...c, hidden: true })),
                ],
        })),
      );
      toast(
        outcome === 'delete'
          ? `“${found.category.name}” deleted`
          : `“${found.category.name}” hidden. Its transactions keep it`,
      );
    },

    restoreCategory(categoryId: string) {
      const found = find(categoryId);
      update((all) => {
        for (const g of all) {
          const at = g.categories.findIndex((c) => c.id === categoryId);
          if (at < 0) continue;
          const [category] = g.categories.splice(at, 1);
          if (!category) continue;
          category.hidden = false;
          g.hidden = false;
          g.categories.splice(g.categories.filter((c) => !c.hidden).length, 0, category);
        }
        return all;
      });
      if (found) toast(`“${found.category.name}” is back in ${found.group.name}`);
    },

    addGroup(kind: CategoryKind, name: string) {
      const id = newId('group');
      update((all) => {
        const group: ProtoGroup = { id, name: name.trim(), kind, hidden: false, categories: [] };
        // Income groups come first, then the expense ones: a new one goes at the end of its kind
        const lastOfKind = all.findLastIndex((g) => g.kind === kind);
        all.splice(lastOfKind + 1, 0, group);
        return all;
      });
      toast(`Group “${name.trim()}” added`);
      return id;
    },

    renameGroup(groupId: string, name: string) {
      update((all) => {
        for (const g of all) if (g.id === groupId) g.name = name.trim();
        return all;
      });
    },

    /** Moves a group to a place among the shown groups of its kind. */
    moveGroup(groupId: string, toIndex: number) {
      update((all) => {
        const at = all.findIndex((g) => g.id === groupId);
        const [group] = all.splice(at, 1);
        if (!group) return all;
        const sameKind = all.filter((g) => g.kind === group.kind && !g.hidden);
        const before = sameKind[toIndex];
        const insertAt = before
          ? all.indexOf(before)
          : all.findLastIndex((g) => g.kind === group.kind) + 1;
        all.splice(insertAt, 0, group);
        return all;
      });
    },

    restoreGroup(groupId: string) {
      const group = groups.find((g) => g.id === groupId);
      update((all) => all.map((g) => (g.id === groupId ? { ...g, hidden: false } : g)));
      if (group) toast(`Group “${group.name}” is back`);
    },

    removeGroup(groupId: string) {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;
      const removal = groupRemoval(group, groups);
      if (!('can' in removal)) return;
      update((all) =>
        removal.can === 'delete'
          ? all.filter((g) => g.id !== groupId)
          : all.map((g) => (g.id === groupId ? { ...g, hidden: true } : g)),
      );
      toast(
        removal.can === 'delete' ? `Group “${group.name}” deleted` : `Group “${group.name}” hidden`,
      );
    },
  };
}

export type CategoryEdits = ReturnType<typeof useCategoryEdits>;

/** The shown groups of one kind, in order. */
export const groupsOf = (groups: ProtoGroup[], kind: CategoryKind) =>
  groups.filter((g) => g.kind === kind && !g.hidden);

export const shownOf = (group: ProtoGroup) => group.categories.filter((c) => !c.hidden);
export const hiddenOf = (group: ProtoGroup) => group.categories.filter((c) => c.hidden);
