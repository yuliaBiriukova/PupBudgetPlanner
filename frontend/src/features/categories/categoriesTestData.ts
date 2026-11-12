import type { CategoriesOverview, CategoryKind } from './categoriesApi';

const DEFAULT_SET: [string, CategoryKind, string[]][] = [
  ['Income', 'Income', ['Salary', 'Gifts', 'Other']],
  [
    'Home expenses',
    'Expense',
    [
      'Rent',
      'Bills',
      'Home supplies',
      'Electronics',
      'Bank commission',
      'Gifts',
      'Tax',
      'Delivery',
      'Other',
    ],
  ],
  [
    'Daily living',
    'Expense',
    ['Groceries', 'Clothing', 'Eating out', 'Transportation', 'Salon/Barber', 'Sport'],
  ],
  ['Health', 'Expense', ['Doctor/Dentist', 'Medicine/Drugs/Skincare', 'Emergency', 'Therapy']],
  ['Education', 'Expense', ['English lessons', 'Piano lessons', 'Driving']],
  ['Entertainment', 'Expense', ['Activities', 'Books', 'Games', 'Hobbies', 'Vacation']],
  ['Subscriptions', 'Expense', ['Spotify', 'Phone', 'Subscriptions']],
];

/** Categories nobody has used yet: removing them deletes them (F-029). */
const UNUSED = new Set(['Tax', 'Sport', 'Games', 'Driving', 'Emergency']);

/** A steady fake count of transactions from a name, so every story and test shows the same. */
function countOf(name: string) {
  if (UNUSED.has(name)) return 0;
  let hash = 7;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 100_003;
  return 3 + (hash % 140);
}

/**
 * The default set every person gets (PRODUCT.md "Default categories"), as the API sends it: nothing hidden, five
 * categories never used (Tax, Sport, Emergency, Driving, Games), the others with a few transactions.
 */
export const DEFAULT_CATEGORIES: CategoriesOverview = {
  groups: DEFAULT_SET.map(([name, kind, categories], group) => ({
    id: `group-${String(group + 1)}`,
    name,
    kind,
    isHidden: false,
    isPrivate: false,
    categories: categories.map((category, index) => ({
      id: `group-${String(group + 1)}-${String(index + 1)}`,
      name: category,
      isHidden: false,
      transactionCount: countOf(category),
      isPrivate: false,
    })),
  })),
};

/**
 * The set after some changes (F-029): Netflix hidden in Subscriptions (9 transactions), and a hidden group "Car" with
 * its hidden Fuel (14 transactions).
 */
export const EDITED_CATEGORIES: CategoriesOverview = {
  groups: [
    ...DEFAULT_CATEGORIES.groups.map((group) =>
      group.name === 'Subscriptions'
        ? {
            ...group,
            categories: [
              ...group.categories,
              {
                id: 'group-7-netflix',
                name: 'Netflix',
                isHidden: true,
                transactionCount: 9,
                isPrivate: false,
              },
            ],
          }
        : group,
    ),
    {
      id: 'group-car',
      name: 'Car',
      kind: 'Expense',
      isHidden: true,
      isPrivate: false,
      categories: [
        {
          id: 'group-car-fuel',
          name: 'Fuel',
          isHidden: true,
          transactionCount: 14,
          isPrivate: false,
        },
      ],
    },
  ],
};

export const NO_CATEGORIES: CategoriesOverview = { groups: [] };
