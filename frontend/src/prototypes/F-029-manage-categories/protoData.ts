import { DEFAULT_CATEGORIES } from '../../features/categories/categoriesTestData';
import type { CategoryKind } from '../../features/categories/categoriesApi';

/** A category in the prototype: how many transactions it has (0: it can be deleted) and this year's money. */
export interface ProtoCategory {
  id: string;
  name: string;
  /** Transactions with this category; 0 → deleted for good when removed, otherwise hidden. */
  used: number;
  /** This year's total in UAH (variant 3 shows it). */
  year: number;
  hidden: boolean;
}

export interface ProtoGroup {
  id: string;
  name: string;
  kind: CategoryKind;
  hidden: boolean;
  categories: ProtoCategory[];
}

/** A year's money that looks like a household's, for the biggest ones. */
const YEAR: Record<string, number> = {
  Salary: 612_000,
  Gifts: 18_400,
  Other: 9_600,
  Rent: 168_000,
  Bills: 38_250,
  Groceries: 104_830,
  'Eating out': 41_270,
  Vacation: 64_500,
};

/** Categories nobody has used yet: removing them deletes them. */
const UNUSED = new Set(['Tax', 'Sport', 'Games', 'Driving', 'Emergency']);

/** A steady fake number from a name, so every story shows the same amounts. */
function seed(text: string) {
  let hash = 7;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) % 100_003;
  return hash;
}

/** The default set with fake use and money, and one hidden category (Netflix, with transactions). */
export function protoGroups(): ProtoGroup[] {
  return DEFAULT_CATEGORIES.groups.map((group) => {
    const categories: ProtoCategory[] = group.categories.map((category) => {
      const unused = UNUSED.has(category.name);
      const n = seed(category.name);
      return {
        id: category.id,
        name: category.name,
        used: unused ? 0 : 3 + (n % 140),
        year: unused ? 0 : (YEAR[category.name] ?? Math.round((900 + (n % 24_000)) / 10) * 10),
        hidden: false,
      };
    });
    if (group.name === 'Subscriptions') {
      categories.push({
        id: `${group.id}-netflix`,
        name: 'Netflix',
        used: 9,
        year: 2110,
        hidden: true,
      });
    }
    return { id: group.id, name: group.name, kind: group.kind, hidden: false, categories };
  });
}
