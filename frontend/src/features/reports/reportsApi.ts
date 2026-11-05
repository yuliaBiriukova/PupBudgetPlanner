import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';

type Schemas = components['schemas'];

/** A row's numbers: one a month (none for a month still to come), the period's Total and Avg. */
export interface ReportLine {
  months: (number | null)[];
  total: number | null;
  average: number | null;
}

export interface ReportCategory {
  id: string;
  name: string;
  isArchived: boolean;
  amounts: ReportLine;
}

export interface ReportGroup {
  id: string;
  name: string;
  kind: Schemas['CategoryKind'];
  categories: ReportCategory[];
  total: ReportLine;
}

export interface ReportSummary {
  income: ReportLine;
  expenses: ReportLine;
  net: ReportLine;
  otherChanges: ReportLine;
  balance: ReportLine;
  startBalance: number | null;
}

/**
 * The yearly or monthly report as the page uses it (F-021's API, F-022): the API may send its amounts as text
 * (decimals there). `months` are the report's columns, `firstMonth` the person's first month with data (`2026-02-01`).
 */
export interface Report {
  currency: string;
  months: Schemas['ReportMonth'][];
  monthsCounted: number | null;
  groups: ReportGroup[];
  summary: ReportSummary;
  firstMonth: string | null;
}

const amount = (value: number | string | null) => (value === null ? null : Number(value));

const toLine = (line: Schemas['ReportLine']): ReportLine => ({
  months: line.months.map(amount),
  total: amount(line.total),
  average: amount(line.average),
});

export const toReport = (data: Schemas['Report']): Report => ({
  currency: data.currency,
  months: data.months,
  monthsCounted: amount(data.monthsCounted),
  groups: data.groups.map((group) => ({
    id: group.id,
    name: group.name,
    kind: group.kind,
    categories: group.categories.map((category) => ({
      id: category.id,
      name: category.name,
      isArchived: category.isArchived,
      amounts: toLine(category.amounts),
    })),
    total: toLine(group.total),
  })),
  summary: {
    income: toLine(data.summary.income),
    expenses: toLine(data.summary.expenses),
    net: toLine(data.summary.net),
    otherChanges: toLine(data.summary.otherChanges),
    balance: toLine(data.summary.balance),
    startBalance: amount(data.summary.startBalance),
  },
  firstMonth: data.firstMonth,
});

/** Every report: fetched again after a transaction is saved or deleted, or the report currency changes. */
export const reportsKey = ['reports'] as const;

/** One report's key: both kinds alike, so the page can ask for either. */
const reportKey = (...parts: (string | number | null)[]) => [...reportsKey, ...parts];

/**
 * January to December of `year`, in `currency` or the person's report currency. The last report stays on screen
 * while the next one loads.
 */
export const yearReportQuery = (year: number, currency?: string) =>
  queryOptions({
    queryKey: reportKey('year', year, currency ?? null),
    queryFn: async ({ signal }): Promise<Report> => {
      const { data, response } = await apiClient.GET('/api/reports/year', {
        params: { query: { year, currency } },
        signal,
      });
      if (!response.ok || !data)
        throw new Error(`Couldn't load the report: ${String(response.status)}`);
      return toReport(data);
    },
    placeholderData: keepPreviousData,
  });

/** One month (`2026-10`), in `currency` or the person's report currency. */
export const monthReportQuery = (month: string, currency?: string) =>
  queryOptions({
    queryKey: reportKey('month', month, currency ?? null),
    queryFn: async ({ signal }): Promise<Report> => {
      const { data, response } = await apiClient.GET('/api/reports/month', {
        params: { query: { month, currency } },
        signal,
      });
      if (!response.ok || !data)
        throw new Error(`Couldn't load the report: ${String(response.status)}`);
      return toReport(data);
    },
    placeholderData: keepPreviousData,
  });
