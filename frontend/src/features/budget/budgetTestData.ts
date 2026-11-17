import type { components } from '../../shared/api/schema';

type MonthBudget = components['schemas']['MonthBudget'];

/**
 * A month as the API sends it (F-033's final prototype): 50 000 in total; Home expenses 23 000 (Rent 18 000, all spent);
 * Daily living 22 000 (Food 13 000, Eating out 2 000 and over, Transportation 1 500, Clothing without a budget);
 * Entertainment 2 000 with no category budgets; Subscriptions without its own budget (Phone 300, Music 200); Health
 * with nothing planned or spent.
 */
export function plannedMonth(month: string): MonthBudget {
  return {
    month,
    currency: 'UAH',
    planned: true,
    startFrom: null,
    total: 50_000,
    spent: 31_482,
    ratesMissing: false,
    groups: [
      {
        id: 'g-home',
        name: 'Home expenses',
        budget: 23_000,
        spent: 18_000,
        categories: [
          { id: 'c-rent', name: 'Rent', budget: 18_000, spent: 18_000 },
          { id: 'c-bills', name: 'Bills', budget: null, spent: 0 },
        ],
      },
      {
        id: 'g-daily',
        name: 'Daily living',
        budget: 22_000,
        spent: 12_286,
        categories: [
          { id: 'c-food', name: 'Food', budget: 13_000, spent: 7_149 },
          { id: 'c-clothing', name: 'Clothing', budget: null, spent: 1_890 },
          { id: 'c-eating', name: 'Eating out', budget: 2_000, spent: 2_607 },
          { id: 'c-transport', name: 'Transportation', budget: 1_500, spent: 640 },
        ],
      },
      {
        id: 'g-fun',
        name: 'Entertainment',
        budget: 2_000,
        spent: 696,
        categories: [{ id: 'c-activities', name: 'Activities', budget: null, spent: 696 }],
      },
      {
        id: 'g-subs',
        name: 'Subscriptions',
        budget: null,
        spent: 500,
        categories: [
          { id: 'c-phone', name: 'Phone', budget: 300, spent: 300 },
          { id: 'c-music', name: 'Music & streaming', budget: 200, spent: 200 },
        ],
      },
      {
        id: 'g-health',
        name: 'Health',
        budget: null,
        spent: 0,
        categories: [{ id: 'c-doctor', name: 'Doctor/Dentist', budget: null, spent: 0 }],
      },
    ],
  };
}

/** A month never planned; `startFrom` the last planned one, if any. */
export function notPlannedMonth(month: string, startFrom: string | null): MonthBudget {
  const planned = plannedMonth(month);
  return {
    ...planned,
    planned: false,
    startFrom,
    total: null,
    groups: planned.groups.map((group) => ({
      ...group,
      budget: null,
      categories: group.categories.map((category) => ({ ...category, budget: null })),
    })),
  };
}
