import type { Account, AccountsOverview } from './accountsApi';

/** The final prototype's accounts (F-014), for tests and stories. */
export const account = (id: string, name: string, extra: Partial<Account> = {}): Account => ({
  id,
  name,
  currency: 'UAH',
  source: 'Cash',
  sourceId: null,
  sourceName: null,
  bankId: null,
  bankName: null,
  openingBalance: 0,
  openingDate: '2026-01-01',
  balance: 0,
  cardStyle: 'Envelope',
  archivedAt: null,
  ...extra,
});

const bank = (name: string) =>
  ({ source: 'Bank', bankId: `b-${name}`, bankName: name, cardStyle: 'Solid' }) as const;
const money = (balance: number) => ({ balance, openingBalance: balance });

export const ACCOUNTS: Account[] = [
  account('mono', 'Mono black', { ...bank('Monobank'), ...money(48211) }),
  account('mono-credit', 'Mono credit', { ...bank('Monobank'), ...money(-4312) }),
  account('mono-usd', 'Mono dollars', { ...bank('Monobank'), currency: 'USD', ...money(1240) }),
  account('privat', 'Privat card', {
    ...bank('PrivatBank'),
    cardStyle: 'Tinted',
    ...money(12784),
  }),
  account('privat-eur', 'Privat euro', {
    ...bank('PrivatBank'),
    cardStyle: 'Tinted',
    currency: 'EUR',
    ...money(300),
  }),
  account('cash', 'Wallet', money(3450)),
  account('cash-usd', 'Dollars at home', { currency: 'USD', ...money(500) }),
  account('cash-pln', 'Złoty left from Kraków', { currency: 'PLN', ...money(640) }),
  account('deposit', 'Deposit for the new apartment', {
    source: 'Own',
    sourceId: 's-deposit',
    sourceName: 'Deposit',
    cardStyle: 'Plain',
    ...money(250000),
  }),
];

export const ARCHIVED: Account[] = [
  account('oschad', 'Oschad salary card', {
    ...bank('Oschadbank'),
    cardStyle: 'Plain',
    archivedAt: '2026-10-03T10:00:00Z',
  }),
  account('old-usd', 'Old Privat dollars', {
    ...bank('PrivatBank'),
    cardStyle: 'Plain',
    currency: 'USD',
    ...money(12),
    archivedAt: '2026-09-20T10:00:00Z',
  }),
];

export const CURRENCIES = [
  'UAH',
  'AUD',
  'AZN',
  'BDT',
  'CAD',
  'CHF',
  'CNY',
  'CZK',
  'DKK',
  'DZD',
  'EGP',
  'EUR',
  'GBP',
  'GEL',
  'HKD',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'JPY',
  'KRW',
  'KZT',
  'LBP',
  'MDL',
  'MXN',
  'MYR',
  'NOK',
  'NZD',
  'PLN',
  'RON',
  'RSD',
  'SAR',
  'SEK',
  'SGD',
  'THB',
  'TND',
  'TRY',
  'USD',
  'VND',
  'ZAR',
];

/** The page as the API answers it for these accounts. */
export const OVERVIEW: AccountsOverview = {
  accounts: ACCOUNTS,
  archived: ARCHIVED,
  totals: [
    { currency: 'UAH', accounts: 5, total: 310133 },
    { currency: 'USD', accounts: 2, total: 1740 },
    { currency: 'EUR', accounts: 1, total: 300 },
    { currency: 'PLN', accounts: 1, total: 640 },
  ],
  sources: [{ id: 's-deposit', name: 'Deposit' }],
  banks: [
    { id: 'b-Monobank', name: 'Monobank' },
    { id: 'b-Oschadbank', name: 'Oschadbank' },
    { id: 'b-PrivatBank', name: 'PrivatBank' },
  ],
  currencies: CURRENCIES,
};

export const EMPTY: AccountsOverview = {
  accounts: [],
  archived: [],
  totals: [],
  sources: [],
  banks: [],
  currencies: CURRENCIES,
};
