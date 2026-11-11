import type { MockAnswer, MockRoutes } from '../../test/mockFetch';
import type { CategoriesOverview, Category, CategoryGroup, CategoryKind } from './categoriesApi';
import { groupRemoval, sameName, shownOf } from './categoryRules';

interface CategoryBody {
  groupId: string;
  name: string;
  place: number | null;
}

interface GroupBody {
  kind: CategoryKind;
  name: string;
  place: number | null;
}

const nameTaken: MockAnswer = {
  status: 400,
  json: { errors: { name: ['This name is already in use there.'] } },
};
const notFound: MockAnswer = { status: 404 };
const conflict: MockAnswer = { status: 409 };

/** Puts an item at a place in a list (the end when none or past it). */
function insert<T>(list: T[], item: T, place: number | null | undefined) {
  list.splice(Math.min(place ?? list.length, list.length), 0, item);
}

/**
 * The categories API of the stories (F-029), keeping every change while the story is shown, with the API's rules
 * (`CategorySet`): unique names, places among the shown ones, hide instead of delete once used, a group goes only
 * without shown categories and not as the last of its kind. `fail` answers every change with a 500.
 */
export function fakeCategoriesRoutes(
  start: CategoriesOverview,
  { fail = false }: { fail?: boolean } = {},
): MockRoutes {
  let groups: CategoryGroup[] = structuredClone(start.groups);
  let next = 1;
  const failed: MockAnswer = { status: 500 };

  const find = (id: string) => {
    for (const group of groups) {
      const category = group.categories.find((c) => c.id === id);
      if (category) return { group, category };
    }
    return undefined;
  };
  /** A shown category at a place among the group's shown ones, the hidden ones after them. */
  const place = (group: CategoryGroup, category: Category, at: number | null | undefined) => {
    const shown = shownOf(group).filter((c) => c.id !== category.id);
    insert(shown, category, at);
    group.categories = [...shown, ...group.categories.filter((c) => c.isHidden)];
  };
  const placeGroup = (group: CategoryGroup, at: number | null | undefined) => {
    const rest = groups.filter((g) => g.id !== group.id);
    const shown = rest.filter((g) => g.kind === group.kind && !g.isHidden);
    const before = shown[at ?? shown.length];
    const index = before
      ? rest.indexOf(before)
      : rest.findLastIndex((g) => g.kind === 'Income' || group.kind === 'Expense') + 1;
    rest.splice(index, 0, group);
    groups = rest;
  };
  const clash = (group: CategoryGroup, name: string, self?: string) =>
    group.categories.some((c) => c.id !== self && sameName(c.name, name));

  return {
    '/api/categories': () => ({ json: { groups } }),

    'POST /api/categories': (body) => {
      if (fail) return failed;
      const { groupId, name, place: at } = body as CategoryBody;
      const group = groups.find((g) => g.id === groupId);
      if (!group) return notFound;
      if (clash(group, name)) return nameTaken;
      const category = { id: `new-${String(next++)}`, name, isHidden: false, transactionCount: 0 };
      place(group, category, at);
      return { json: { id: category.id } };
    },

    'PUT /api/categories/{id}': (body, _, { id = '' }) => {
      if (fail) return failed;
      const { groupId, name, place: at } = body as CategoryBody;
      const found = find(id);
      const group = groups.find((g) => g.id === groupId);
      if (!found || !group) return notFound;
      if (found.category.isHidden || group.kind !== found.group.kind) return conflict;
      if (clash(group, name, id)) return nameTaken;
      found.category.name = name;
      if (group.id !== found.group.id)
        found.group.categories = found.group.categories.filter((c) => c.id !== id);
      place(group, found.category, at);
      return { status: 204 };
    },

    'DELETE /api/categories/{id}': (_, __, { id = '' }) => {
      if (fail) return failed;
      const found = find(id);
      if (!found) return notFound;
      const { group, category } = found;
      group.categories = group.categories.filter((c) => c.id !== id);
      if (category.transactionCount === 0) return { json: { removal: 'Deleted' } };
      group.categories.push({ ...category, isHidden: true });
      return { json: { removal: 'Hidden' } };
    },

    'POST /api/categories/{id}/restore': (_, __, { id = '' }) => {
      if (fail) return failed;
      const found = find(id);
      if (!found) return notFound;
      found.category.isHidden = false;
      found.group.isHidden = false;
      place(found.group, found.category, null);
      return { status: 204 };
    },

    'POST /api/categories/groups': (body) => {
      if (fail) return failed;
      const { kind, name, place: at } = body as GroupBody;
      if (groups.some((g) => sameName(g.name, name))) return nameTaken;
      const group: CategoryGroup = {
        id: `new-group-${String(next++)}`,
        name,
        kind,
        isHidden: false,
        categories: [],
      };
      placeGroup(group, at);
      return { json: { id: group.id } };
    },

    'PUT /api/categories/groups/{id}': (body, _, { id = '' }) => {
      if (fail) return failed;
      const { name, place: at } = body as GroupBody;
      const group = groups.find((g) => g.id === id);
      if (!group) return notFound;
      if (group.isHidden) return conflict;
      if (groups.some((g) => g.id !== id && sameName(g.name, name))) return nameTaken;
      group.name = name;
      if (at !== null) placeGroup(group, at);
      return { status: 204 };
    },

    'DELETE /api/categories/groups/{id}': (_, __, { id = '' }) => {
      if (fail) return failed;
      const group = groups.find((g) => g.id === id);
      if (!group) return notFound;
      const removal = groupRemoval(group, groups);
      if ('cannot' in removal) return conflict;
      if (removal.can === 'delete') {
        groups = groups.filter((g) => g.id !== id);
        return { json: { removal: 'Deleted' } };
      }
      group.isHidden = true;
      return { json: { removal: 'Hidden' } };
    },

    'POST /api/categories/groups/{id}/restore': (_, __, { id = '' }) => {
      if (fail) return failed;
      const group = groups.find((g) => g.id === id);
      if (!group) return notFound;
      group.isHidden = false;
      return { status: 204 };
    },
  };
}
