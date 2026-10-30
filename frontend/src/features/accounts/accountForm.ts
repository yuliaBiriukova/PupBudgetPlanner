import dayjs from 'dayjs';
import { amountText, parseAmount } from '../../shared/format/money';
import {
  defaultStyle,
  type Account,
  type AccountsOverview,
  type CardStyle,
  type SaveAccountRequest,
  type SourceKind,
} from './accountsApi';

/** The API's limits (Account, AccountSource and Bank in the backend). */
export const NAME_MAX = 40;
export const SOURCE_NAME_MAX = 30;
export const BANK_NAME_MAX = 40;

/** Common Ukrainian banks, suggested while a bank's name is typed; the person's own banks are left out. */
export const SUGGESTED_BANKS = [
  'A-Bank',
  'Credit Agricole',
  'Izibank',
  'Monobank',
  'Oschadbank',
  'OTP Bank',
  'PrivatBank',
  'ProCredit Bank',
  'PUMB',
  'Raiffeisen Bank',
  'Sense Bank',
  'Ukrgasbank',
  'Ukrsibbank',
];

/** The picked source: Cash, Bank, or one of the person's own sources by id. */
export type SourceChoice = 'Cash' | 'Bank' | `own:${string}`;

export interface AccountFormValues {
  name: string;
  currency: string;
  source: SourceChoice;
  /** A new source being typed: no source pill is picked meanwhile. */
  newSource: string | null;
  /** The picked bank, by name; null when none is picked yet. */
  bank: string | null;
  /** A bank being typed instead of picked. */
  newBank: string | null;
  openingBalance: string;
  /** `YYYY-MM-DD`. */
  openingDate: string;
  cardStyle: CardStyle;
  /** Picked by the person: from then on the style no longer follows the source. */
  styleSet: boolean;
}

/** What a group's add card fills in. */
export interface FormPreset {
  currency?: string;
  source?: SourceChoice;
  bank?: string;
}

export function sourceKind(values: Pick<AccountFormValues, 'source' | 'newSource'>): SourceKind {
  if (values.newSource !== null || values.source.startsWith('own:')) return 'Own';
  return values.source === 'Cash' ? 'Cash' : 'Bank';
}

/** A new account: hryvnia, a bank card from the first of your banks, today, unless the group says otherwise. */
export function blankForm(
  overview: AccountsOverview,
  preset: FormPreset = {},
  today = dayjs().format('YYYY-MM-DD'),
): AccountFormValues {
  const source = preset.source ?? 'Bank';
  const bank = preset.bank ?? overview.banks[0]?.name ?? null;
  const values = {
    name: '',
    currency: preset.currency ?? 'UAH',
    source,
    newSource: null,
    bank,
    // Nobody to pick yet: the bank's name is typed right away
    newBank: bank === null ? '' : null,
    openingBalance: amountText(0),
    openingDate: today,
    styleSet: false,
  };
  return { ...values, cardStyle: defaultStyle(sourceKind(values)) };
}

export function formFor(account: Account): AccountFormValues {
  return {
    name: account.name,
    currency: account.currency,
    source: account.source === 'Own' ? `own:${account.sourceId ?? ''}` : account.source,
    newSource: null,
    bank: account.bankName,
    newBank: null,
    openingBalance: amountText(account.openingBalance),
    openingDate: account.openingDate,
    cardStyle: account.cardStyle,
    styleSet: true,
  };
}

/** Picking another source; the card style follows it until the person picks one. */
export function withSource(values: AccountFormValues, source: SourceChoice): AccountFormValues {
  const next = { ...values, source, newSource: null };
  return next.styleSet ? next : { ...next, cardStyle: defaultStyle(sourceKind(next)) };
}

/** Starting to type a new source. */
export function withNewSource(values: AccountFormValues, name: string): AccountFormValues {
  const next = { ...values, newSource: name };
  return next.styleSet ? next : { ...next, cardStyle: defaultStyle('Own') };
}

export type FormErrors = Partial<
  Record<'name' | 'newSource' | 'bank' | 'openingBalance' | 'openingDate', FormError>
>;

export type FormError =
  { key: 'name' | 'newSource' | 'bank' | 'amount' | 'date' } | { key: 'tooLong'; max: number };

/** The form's mistakes, as the API would find them, so they show under the fields before anything is sent. */
export function validateForm(values: AccountFormValues): FormErrors {
  const errors: FormErrors = {};
  /** A required name: the field's own message when empty, "too long" over `max`. */
  const named = (text: string, max: number, empty: FormError): FormError | undefined =>
    !text.trim() ? empty : text.trim().length > max ? { key: 'tooLong', max } : undefined;
  const check = (field: keyof FormErrors, error: FormError | undefined) => {
    if (error) errors[field] = error;
  };

  check('name', named(values.name, NAME_MAX, { key: 'name' }));
  if (values.newSource !== null) {
    check('newSource', named(values.newSource, SOURCE_NAME_MAX, { key: 'newSource' }));
  }
  if (sourceKind(values) === 'Bank') {
    check('bank', named(values.newBank ?? values.bank ?? '', BANK_NAME_MAX, { key: 'bank' }));
  }
  if (parseAmount(values.openingBalance) === null) errors.openingBalance = { key: 'amount' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.openingDate) || !dayjs(values.openingDate).isValid())
    errors.openingDate = { key: 'date' };
  return errors;
}

/** What the API gets; call it on a form without mistakes. */
export function toRequest(
  values: AccountFormValues,
  overview: AccountsOverview,
): SaveAccountRequest {
  const source = sourceKind(values);
  const ownName =
    values.newSource ?? overview.sources.find((s) => `own:${s.id}` === values.source)?.name ?? null;
  return {
    name: values.name.trim(),
    currency: values.currency,
    source,
    sourceName: source === 'Own' ? (ownName?.trim() ?? null) : null,
    bankName: source === 'Bank' ? ((values.newBank ?? values.bank)?.trim() ?? null) : null,
    openingBalance: parseAmount(values.openingBalance) ?? 0,
    openingDate: values.openingDate,
    cardStyle: values.cardStyle,
  };
}

/** Banks to suggest for what is typed: up to 6 that contain it, not yours already, not exactly it. */
export function bankSuggestions(typed: string, yours: readonly string[]): string[] {
  const q = typed.trim().toLocaleLowerCase();
  const mine = new Set(yours.map((b) => b.toLocaleLowerCase()));
  return SUGGESTED_BANKS.filter((b) => {
    const name = b.toLocaleLowerCase();
    return !mine.has(name) && name !== q && (!q || name.includes(q));
  }).slice(0, 6);
}

/**
 * The balance the card in the form shows: the opening balance for a new account; when editing, the balance now,
 * moved by however much the opening balance changes.
 */
export function previewBalance(values: AccountFormValues, account?: Account): number {
  const opening = parseAmount(values.openingBalance) ?? 0;
  return account ? account.balance + opening - account.openingBalance : opening;
}
