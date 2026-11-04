import dayjs from 'dayjs';
import type { components } from '../../shared/api/schema';
import { today } from '../transactions/days';

type ApiReport = components['schemas']['Report'];
type ApiLine = components['schemas']['ReportLine'];
type ApiGroup = components['schemas']['ReportGroup'];

/**
 * A test year in the spreadsheet's shape (F-022's stories and tests, after F-021's `SpreadsheetYearTests`): the
 * months up to this one filled in, the rest to come. Eleven months of amounts are written out; a twelfth repeats the
 * first. Sport, English lessons, Books and Spotify have nothing in the year, so the screen leaves them out.
 */
const GROUPS: [string, 'Income' | 'Expense', [string, number[]][]][] = [
  [
    'Income',
    'Income',
    [
      ['Salary', [91389, 138096, 128832, 129021, 126187, 111020, 118643, 118928, 107969, 83800, 0]],
      ['Gifts', [0, 0, 0, 0, 0, 5000, 0, 0, 0, 0, 0]],
      ['Other', [3100, 1000, 0, 0, 0, 11800, 9506, 2389, 1058, 2679, 0]],
    ],
  ],
  [
    'Home expenses',
    'Expense',
    [
      ['Rent', [17000, 17000, 17000, 17000, 17000, 66700, 0, 20800, 24700, 23732, 0]],
      ['Bills', [3647, 2126, 2965, 3310, 2731, 3073, 0, 0, 2500, 2750, 1180]],
      ['Home supplies', [473, 664, 4330, 0, 0, 1541, 9328, 0, 2298, 0, 0]],
      ['Electronics', [423, 0, 3057, 3935, 0, 0, 0, 20698, 0, 6541, 0]],
      ['Gifts', [2635, 732, 1000, 0, 0, 1740, 0, 41027, 3232, 5856, 0]],
      ['Delivery', [614, 102, 1176, 1121, 687, 326, 2110, 1020, 1595, 893, 140]],
    ],
  ],
  [
    'Daily living',
    'Expense',
    [
      ['Groceries', [1707, 1178, 1342, 3199, 35, 4222, 3880, 3755, 2365, 3353, 846]],
      ['Clothing', [0, 3541, 19830, 22625, 1514, 4956, 3394, 3002, 0, 7861, 0]],
      ['Eating out', [3733, 0, 0, 4103, 2871, 17970, 6028, 7266, 1724, 4813, 620]],
      ['Transportation', [1423, 1693, 963, 2775, 408, 7310, 4096, 2778, 1544, 2100, 310]],
      ['Sport', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ],
  ],
  [
    'Health',
    'Expense',
    [
      ['Doctor/Dentist', [5126, 3420, 0, 8290, 0, 0, 4465, 2580, 0, 0, 0]],
      [
        'Medicine/Drugs/Skincare',
        [1778, 2380, 3591, 6293, 1909, 5209, 4552, 6170, 5427, 3580, 420],
      ],
      ['Emergency', [122361, 0, 0, 0, 0, 0, 800, 0, 0, 0, 0]],
      ['Therapy', [0, 0, 0, 0, 0, 0, 8297, 4702, 4720, 4702, 0]],
    ],
  ],
  [
    'Education',
    'Expense',
    [
      ['English lessons', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
      ['Driving', [0, 0, 0, 0, 316, 0, 0, 0, 16100, 15300, 3800]],
    ],
  ],
  [
    'Entertainment',
    'Expense',
    [
      ['Activities', [2450, 800, 3237, 3874, 0, 1640, 549, 788, 2570, 4695, 0]],
      ['Books', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
      ['Hobbies', [3906, 819, 6750, 6325, 1080, 7290, 1422, 7084, 8660, 5699, 0]],
      ['Vacation', [0, 0, 0, 0, 13056, 0, 0, 0, 0, 0, 0]],
    ],
  ],
  [
    'Subscriptions',
    'Expense',
    [
      ['Spotify', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
      ['Phone', [0, 0, 600, 0, 600, 260, 0, 600, 0, 600, 0]],
    ],
  ],
];

/** The person's first month with data in the test year: January of the year before this one. */
export const FIRST_MONTH = `${String(dayjs(today()).year() - 1)}-01-01`;

/** A category's id in the test data, like the API's (stable, so tests can find its transactions link). */
export function reportCategoryId(group: number, category: number): string {
  return `00000000-0000-4000-8000-${`c${String(group)}${String(category)}`.padStart(12, '0')}`;
}

type Values = (number | null)[];

const sum = (values: Values) => values.reduce<number>((all, v) => all + (v ?? 0), 0);

/** Adds rows month by month; a month still to come stays without numbers. */
const add = (rows: Values[], length: number): Values =>
  Array.from({ length }, (_, m) =>
    rows.every((row) => row[m] === null) ? null : sum(rows.map((row) => row[m] ?? null)),
  );

/**
 * The year report the API gives for `year` against `now`: the months after this one have no numbers. `rate` turns it
 * into dollars (a rough one, enough for a story).
 */
export function fakeYearReport(
  year: number,
  now: string = today(),
  rate = 1,
  firstMonth: string = FIRST_MONTH,
): ApiReport {
  const thisMonth = dayjs(now).startOf('month');
  const first = dayjs(firstMonth);
  const months = Array.from({ length: 12 }, (_, m) => dayjs(new Date(year, m, 1)));
  const state = (month: dayjs.Dayjs) =>
    month.isBefore(thisMonth) ? 'Passed' : month.isSame(thisMonth) ? 'Current' : 'Future';
  const shown = months.map((month) => state(month) !== 'Future');
  const counted = months.filter((month, m) => shown[m] && !month.isBefore(first)).length;
  const line = (values: Values, withTotal = true, withAverage = true): ApiLine => {
    const total = withTotal ? sum(values) : null;
    return {
      months: values,
      total,
      average: withAverage && total !== null && counted > 0 ? total / counted : null,
    };
  };
  const amounts = (values: number[]): Values =>
    months.map((month, m) =>
      !shown[m] ? null : month.isBefore(first) ? 0 : (values[m % 11] ?? 0) / rate,
    );

  const totals: Record<'Income' | 'Expense', Values[]> = { Income: [], Expense: [] };
  const groups: ApiGroup[] = GROUPS.map(([name, kind, categories], g) => {
    const rows = categories.map(([category, values]) => [category, amounts(values)] as const);
    const total = add(
      rows.map(([, values]) => values),
      12,
    );
    totals[kind].push(total);
    return {
      id: `00000000-0000-4000-8000-00000000000${String(g)}`,
      name,
      kind,
      categories: rows.map(([category, values], c) => ({
        id: reportCategoryId(g, c),
        name: category,
        isArchived: false,
        amounts: line(values),
      })),
      total: line(total),
    };
  });

  const income = add(totals.Income, 12);
  const expenses = add(totals.Expense, 12);
  const net = income.map((value, m) => (value === null ? null : value - (expenses[m] ?? 0)));
  // A person who started this year: nothing on the accounts before, the opening balances in their first month
  const opening = 590_000 / rate;
  const startsLater = first.isAfter(months[0] ?? first);
  const other = net.map((value, m) => {
    const month = months[m];
    if (value === null || !month || month.isBefore(first)) return value === null ? null : 0;
    return (700 + 40 * m) / rate + (startsLater && month.isSame(first, 'month') ? opening : 0);
  });
  const startBalance = startsLater ? 0 : opening;
  let balance = startBalance;
  const balances = net.map((value, m) => {
    if (value === null) return null;
    balance += value + (other[m] ?? 0);
    return balance;
  });

  return {
    currency: rate === 1 ? 'UAH' : 'USD',
    months: months.map((month) => ({
      month: month.format('YYYY-MM-DD'),
      state: state(month),
      ratesMissing: false,
      balanceRates: null,
    })),
    monthsCounted: counted,
    groups,
    summary: {
      income: line(income),
      expenses: line(expenses),
      net: line(net),
      otherChanges: line(other, true, false),
      balance: line(balances, false, false),
      startBalance,
    },
    firstMonth,
  };
}

/** The monthly report the API gives for `month` (`2026-10`): its column of the year, no Avg. */
export function fakeMonthReport(month: string, now: string = today(), rate = 1): ApiReport {
  const index = Number(month.slice(5, 7)) - 1;
  const year = fakeYearReport(Number(month.slice(0, 4)), now, rate);
  const pick = (source: ApiLine, withTotal = true): ApiLine => {
    const value = source.months[index] ?? null;
    return { months: [value], total: withTotal ? value : null, average: null };
  };
  const previous =
    index === 0
      ? year.summary.startBalance
      : (year.summary.balance.months[index - 1] ?? year.summary.startBalance);
  return {
    ...year,
    months: year.months.slice(index, index + 1),
    monthsCounted: null,
    groups: year.groups.map((group) => ({
      ...group,
      categories: group.categories.map((category) => ({
        ...category,
        amounts: pick(category.amounts),
      })),
      total: pick(group.total),
    })),
    summary: {
      income: pick(year.summary.income),
      expenses: pick(year.summary.expenses),
      net: pick(year.summary.net),
      otherChanges: pick(year.summary.otherChanges),
      balance: pick(year.summary.balance, false),
      startBalance: previous,
    },
  };
}

/** A person without any transactions or accounts yet: every month nothing, no first month. */
export function emptyYearReport(year: number, now: string = today()): ApiReport {
  const report = fakeYearReport(year, now);
  const zero = (line: ApiLine): ApiLine => ({
    months: line.months.map((v) => (v === null ? null : 0)),
    total: 0,
    average: null,
  });
  return {
    ...report,
    monthsCounted: 0,
    groups: report.groups.map((group) => ({
      ...group,
      categories: group.categories.map((category) => ({
        ...category,
        amounts: zero(category.amounts),
      })),
      total: zero(group.total),
    })),
    summary: {
      income: zero(report.summary.income),
      expenses: zero(report.summary.expenses),
      net: zero(report.summary.net),
      otherChanges: zero(report.summary.otherChanges),
      balance: zero(report.summary.balance),
      startBalance: 0,
    },
    firstMonth: null,
  };
}
