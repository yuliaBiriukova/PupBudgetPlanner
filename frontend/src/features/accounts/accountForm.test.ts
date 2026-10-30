import { describe, expect, it } from 'vitest';
import {
  bankSuggestions,
  blankForm,
  formFor,
  previewBalance,
  toRequest,
  validateForm,
  withNewSource,
  withSource,
} from './accountForm';
import { groupAccounts, yourCurrencies } from './accountGroups';
import { account, EMPTY, OVERVIEW } from './accountsTestData';

const TODAY = '2026-10-30';

describe('the account form', () => {
  it('starts as a hryvnia bank card at your first bank, today, with the solid style', () => {
    expect(blankForm(OVERVIEW, {}, TODAY)).toMatchObject({
      currency: 'UAH',
      source: 'Bank',
      bank: 'Monobank',
      newBank: null,
      openingBalance: '0.00',
      openingDate: TODAY,
      cardStyle: 'Solid',
      styleSet: false,
    });
  });

  it('asks for a bank name right away when you have no banks yet', () => {
    expect(blankForm(EMPTY, {}, TODAY)).toMatchObject({ bank: null, newBank: '' });
  });

  it('takes what a group fills in, and the style of its source', () => {
    expect(blankForm(OVERVIEW, { currency: 'USD' }, TODAY).currency).toBe('USD');
    expect(blankForm(OVERVIEW, { source: 'Cash' }, TODAY).cardStyle).toBe('Envelope');
    expect(blankForm(OVERVIEW, { source: 'own:s-deposit' }, TODAY).cardStyle).toBe('Plain');
    expect(blankForm(OVERVIEW, { source: 'Bank', bank: 'PrivatBank' }, TODAY).bank).toBe(
      'PrivatBank',
    );
  });

  it('lets the style follow the source until one is picked', () => {
    const form = blankForm(OVERVIEW, {}, TODAY);

    expect(withSource(form, 'Cash').cardStyle).toBe('Envelope');
    expect(withNewSource(form, '').cardStyle).toBe('Plain');
    expect(withSource({ ...form, cardStyle: 'Tinted', styleSet: true }, 'Cash').cardStyle).toBe(
      'Tinted',
    );
  });

  it('finds the mistakes the API would', () => {
    const form = { ...blankForm(EMPTY, {}, TODAY), openingBalance: '1,240.5.0' };

    expect(validateForm(form)).toEqual({
      name: { key: 'name' },
      bank: { key: 'bank' },
      openingBalance: { key: 'amount' },
    });
    expect(
      validateForm({ ...form, name: 'a'.repeat(41), newBank: 'Mono', openingBalance: '5' }),
    ).toEqual({ name: { key: 'tooLong', max: 40 } });
    expect(
      validateForm({ ...withNewSource(form, ' '), name: 'Bitcoin', openingBalance: '0' }),
    ).toEqual({ newSource: { key: 'newSource' } });
  });

  it('sends the source by kind, with the own source or bank by name', () => {
    const form = {
      ...blankForm(OVERVIEW, {}, TODAY),
      name: ' Mono white ',
      openingBalance: '-1 200,5',
    };

    expect(toRequest(form, OVERVIEW)).toEqual({
      name: 'Mono white',
      currency: 'UAH',
      source: 'Bank',
      sourceName: null,
      bankName: 'Monobank',
      openingBalance: -1200.5,
      openingDate: TODAY,
      cardStyle: 'Solid',
    });
    expect(toRequest({ ...form, newBank: ' Sense Bank ' }, OVERVIEW).bankName).toBe('Sense Bank');
    expect(toRequest(withSource(form, 'own:s-deposit'), OVERVIEW)).toMatchObject({
      source: 'Own',
      sourceName: 'Deposit',
      bankName: null,
    });
    expect(toRequest(withNewSource(form, 'Crypto wallet'), OVERVIEW).sourceName).toBe(
      'Crypto wallet',
    );
  });

  it('shows the balance the card will have', () => {
    // Opened with 21 500, now 48 210.50: raising the opening balance by 1 000 raises the balance as much
    const mono = account('mono', 'Mono black', { openingBalance: 21500, balance: 48210.5 });

    expect(previewBalance({ ...formFor(mono), openingBalance: '22500' }, mono)).toBe(49210.5);
    expect(previewBalance({ ...blankForm(OVERVIEW, {}, TODAY), openingBalance: '450' })).toBe(450);
  });

  it('suggests common banks you don’t have yet', () => {
    expect(bankSuggestions('o', ['Monobank', 'PrivatBank'])).toEqual([
      'Credit Agricole',
      'Oschadbank',
      'OTP Bank',
      'ProCredit Bank',
    ]);
    expect(bankSuggestions('', [])).toHaveLength(6);
    expect(bankSuggestions('sense bank', [])).toEqual([]);
  });
});

describe('the groups', () => {
  it('by currency follow the totals, each with its accounts', () => {
    const groups = groupAccounts(OVERVIEW, 'currency');

    expect(groups.map((g) => g.id)).toEqual([
      'currency:UAH',
      'currency:USD',
      'currency:EUR',
      'currency:PLN',
    ]);
    expect(groups[1]?.accounts.map((a) => a.name)).toEqual(['Mono dollars', 'Dollars at home']);
  });

  it('by source: cash, each bank A to Z, then your own sources', () => {
    expect(groupAccounts(OVERVIEW, 'source').map((g) => g.id)).toEqual([
      'cash',
      'bank:Monobank',
      'bank:PrivatBank',
      'own:s-deposit',
    ]);
  });

  it('your currencies come first in the picker, archived ones too', () => {
    expect(yourCurrencies(OVERVIEW)).toEqual(['UAH', 'EUR', 'PLN', 'USD']);
  });
});
