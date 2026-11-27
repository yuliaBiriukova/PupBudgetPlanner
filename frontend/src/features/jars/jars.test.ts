import { describe, expect, it } from 'vitest';
import { account } from '../accounts/accountsTestData';
import {
  accountsFor,
  freeOf,
  holdingAccounts,
  monthsLeft,
  perMonth,
  progress,
  reached,
  splitByPlan,
} from './jars';
import type { Jar } from './jarsApi';

const jar = (id: string, extra: Partial<Jar> = {}): Jar => ({
  id,
  name: id,
  icon: 'Car',
  color: 'Blue',
  currency: 'UAH',
  goal: null,
  by: null,
  note: null,
  saved: 0,
  places: [],
  history: [],
  plannedThisMonth: null,
  setAsideThisMonth: 0,
  ...extra,
});

describe('a jar’s goal', () => {
  it('counts the months to its date, this one included', () => {
    expect(monthsLeft('2027-12', '2026-11')).toBe(14);
    expect(monthsLeft('2026-11', '2026-11')).toBe(1);
    expect(monthsLeft('2026-10', '2026-11')).toBe(0);
  });

  it('says what to save a month to make it, rounded up; nothing without a goal and a date, or once reached', () => {
    const car = { goal: 400_000, by: '2027-12' };
    expect(perMonth(car, 138_000, '2026-11')).toBe(18_715);
    expect(perMonth({ goal: 400_000, by: null }, 0, '2026-11')).toBeNull();
    expect(perMonth(car, 400_000, '2026-11')).toBeNull();
    expect(perMonth({ goal: 1_000, by: '2026-10' }, 0, '2026-11')).toBeNull();
  });

  it('fills up to the goal and no further; a jar without a goal has no progress', () => {
    expect(progress({ goal: 400_000 }, 100_000)).toBe(0.25);
    expect(progress({ goal: 32_000 }, 40_000)).toBe(1);
    expect(progress({ goal: null }, 5_000)).toBe(0);
    expect(reached({ goal: 32_000 }, 32_000)).toBe(true);
    expect(reached({ goal: null }, 32_000)).toBe(false);
  });
});

describe('free money', () => {
  const mono = account('mono', 'Mono black', { balance: 48_211, inJars: 50_000 });
  const privat = account('privat', 'Privat card', { balance: 30_000, inJars: 12_000 });
  const wallet = account('cash', 'Wallet', { balance: 3_450 });
  const credit = account('credit', 'Mono credit', { balance: -4_312 });
  const dollars = account('usd', 'Mono dollars', { currency: 'USD', balance: 1_240, inJars: 900 });

  it('is the balance less the jar money, below zero when spending ate into it', () => {
    expect(freeOf(privat)).toBe(18_000);
    expect(freeOf(mono)).toBe(-1_789);
  });

  it('lists the jar’s currency first, the most free money first, then others by their worth', () => {
    const order = accountsFor(jar('car'), [wallet, mono, credit, dollars, privat], { USD: 41.35 });

    // No credit card with a debt; the dollars' $340 free is worth 14 059 ₴ but come after the hryvnias
    expect(order.map((a) => a.account.id)).toEqual(['privat', 'cash', 'mono', 'usd']);
    expect(order[2]?.free).toBe(-1_789);
  });

  it('shows each account holding jar money with a piece per jar, biggest first', () => {
    const car = jar('car', {
      places: [
        {
          accountId: 'mono',
          accountName: 'Mono black',
          accountCurrency: 'UAH',
          amount: 18_000,
          accountAmount: 18_000,
        },
      ],
    });
    const laptop = jar('laptop', {
      places: [
        {
          accountId: 'mono',
          accountName: 'Mono black',
          accountCurrency: 'UAH',
          amount: 32_000,
          accountAmount: 32_000,
        },
      ],
    });

    const holding = holdingAccounts([car, laptop], [wallet, mono]);

    expect(holding).toHaveLength(1);
    expect(holding[0]?.pieces.map((p) => p.jar.id)).toEqual(['laptop', 'car']);
    expect(holding[0]?.free).toBe(-1_789);
  });
});

describe('filling the split by this month’s plan', () => {
  const plan = [
    { id: 'car', planned: 15_000, setAside: 0 },
    { id: 'carpathians', planned: 5_000, setAside: 2_000 },
    { id: 'laptop', planned: 12_000, setAside: 0 },
  ];

  it('gives each jar what is still to go, in the plan’s order, when the money is enough', () => {
    expect(splitByPlan(40_000, plan)).toEqual({ car: 15_000, carpathians: 3_000, laptop: 12_000 });
  });

  it('stops where the money runs out', () => {
    expect(splitByPlan(16_000, plan)).toEqual({ car: 15_000, carpathians: 1_000 });
    expect(splitByPlan(-500, plan)).toEqual({});
  });
});
