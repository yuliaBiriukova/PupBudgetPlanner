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

/** The default set every person gets (PRODUCT.md "Default categories"), as the API sends it. */
export const DEFAULT_CATEGORIES: CategoriesOverview = {
  groups: DEFAULT_SET.map(([name, kind, categories], group) => ({
    id: `group-${String(group + 1)}`,
    name,
    kind,
    categories: categories.map((category, index) => ({
      id: `group-${String(group + 1)}-${String(index + 1)}`,
      name: category,
    })),
  })),
};

export const NO_CATEGORIES: CategoriesOverview = { groups: [] };
