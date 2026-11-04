import { describe, expect, it } from 'vitest';
import {
  amountOnBlur,
  amountOnFocus,
  bankSuggestions,
  blankForm,
  copyOf,
  formFor,
  previewBalance,
  toRequest,
  validateForm,
  withNewSource,
  withSource,
} from './accountForm';
import { groupAccounts, yourCurrencies } from './accountGroups';
import { account, ARCHIVED, EMPTY, OVERVIEW } from './accountsTestData';

const TODAY = '2026-10-30';

describe('the account form', () => {
  it('starts as a hryvnia bank card at your first bank, today, with the solid style', () => {
    expect(blankForm(OVERVIEW, {}, TODAY)).toMatchObject({
      currency: 'UAH',
      source: 'Bank',
      bank: 'Monobank',
      newBank: null,
      openingBalance: '0',
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
      openingBalance: -1201,
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

  it('finds the account in use a new one would copy, ignoring case and spaces (I-020)', () => {
    const form = { ...blankForm(OVERVIEW, {}, TODAY), name: ' mono BLACK ' };
    const accounts = OVERVIEW.accounts;

    expect(copyOf(toRequest(form, OVERVIEW), accounts)?.id).toBe('mono');
    expect(copyOf(toRequest({ ...form, newBank: 'monobank ' }, OVERVIEW), accounts)?.id).toBe(
      'mono',
    );
    // Another name, currency, bank or source is not a copy
    expect(copyOf(toRequest({ ...form, name: 'Mono white' }, OVERVIEW), accounts)).toBeUndefined();
    expect(copyOf(toRequest({ ...form, currency: 'USD' }, OVERVIEW), accounts)).toBeUndefined();
    expect(copyOf(toRequest({ ...form, bank: 'PrivatBank' }, OVERVIEW), accounts)).toBeUndefined();
    expect(copyOf(toRequest(withSource(form, 'Cash'), OVERVIEW), accounts)).toBeUndefined();
  });

  it('finds copies among cash and own sources too, by the source’s name', () => {
    const cash = { ...withSource(blankForm(OVERVIEW, {}, TODAY), 'Cash'), name: 'wallet' };
    const own = {
      ...withNewSource(blankForm(OVERVIEW, {}, TODAY), 'deposit'),
      name: 'Deposit for the new apartment',
    };

    expect(copyOf(toRequest(cash, OVERVIEW), OVERVIEW.accounts)?.id).toBe('cash');
    expect(copyOf(toRequest(own, OVERVIEW), OVERVIEW.accounts)?.id).toBe('deposit');
  });

  it('leaves out the account being edited and archived accounts', () => {
    const mono = OVERVIEW.accounts.find((a) => a.id === 'mono');
    if (!mono) throw new Error('No Mono black in the test data');
    const oschad = ARCHIVED[0];
    if (!oschad) throw new Error('No archived account in the test data');

    expect(copyOf(toRequest(formFor(mono), OVERVIEW), OVERVIEW.accounts, 'mono')).toBeUndefined();
    expect(copyOf(toRequest(formFor(oschad), OVERVIEW), ARCHIVED)).toBeUndefined();
  });

  it('clears a zero opening balance on focus and puts it back when left empty', () => {
    expect(amountOnFocus('0.00')).toBe('');
    expect(amountOnFocus('0.4')).toBe('0.4');
    expect(amountOnFocus('0')).toBe('');
    expect(amountOnFocus('1240.50')).toBe('1240.50');
    expect(amountOnFocus('1,2.3')).toBe('1,2.3');
    expect(amountOnBlur('  ')).toBe('0');
    expect(amountOnBlur('1240.50')).toBe('1241');
    expect(amountOnBlur('1,2.3')).toBe('1,2.3');
    expect(amountOnBlur('450')).toBe('450');
  });

  it('takes an empty opening balance as nothing on the account yet', () => {
    const form = { ...blankForm(OVERVIEW, {}, TODAY), name: 'Wallet', openingBalance: '' };

    expect(validateForm(form)).toEqual({});
    expect(toRequest(form, OVERVIEW).openingBalance).toBe(0);
  });

  it('shows the balance the card will have', () => {
    // Opened with 21 500, now 48 211: raising the opening balance by 1 000 raises the balance as much
    const mono = account('mono', 'Mono black', { openingBalance: 21500, balance: 48211 });

    expect(previewBalance({ ...formFor(mono), openingBalance: '22500' }, mono)).toBe(49211);
    expect(previewBalance({ ...blankForm(OVERVIEW, {}, TODAY), openingBalance: '450' })).toBe(450);
  });

  it('suggests common banks you don’t have yet', () => {
    expect(bankSuggestions('o', ['Monobank', 'PrivatBank'])).toEqual(['Oschadbank', 'OTP Bank']);
    expect(bankSuggestions('', [])).toHaveLength(6);
    expect(bankSuggestions('pumb', [])).toEqual([]);
    expect(bankSuggestions('bank', [])).not.toContain('Sense Bank');
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
