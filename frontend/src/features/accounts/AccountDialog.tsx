import { Button, Radio, TextInput, UnstyledButton } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconAlertCircle,
  IconArchive,
  IconCalendar,
  IconInfoCircle,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { useId, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { currencySign, formatMoney } from '../../shared/format/money';
import { CurrencyPicker } from '../../shared/ui/CurrencyPicker';
import { cx } from '../../shared/ui/cx';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import { AccountCard, CardStyleMini } from './AccountCard';
import pills from '../../shared/ui/Pills.module.css';
import classes from './Accounts.module.css';
import {
  amountOnBlur,
  amountOnFocus,
  bankSuggestions,
  blankForm,
  formFor,
  previewBalance,
  sourceKind,
  toRequest,
  validateForm,
  withNewSource,
  withSource,
  BANK_NAME_MAX,
  NAME_MAX,
  SOURCE_NAME_MAX,
  type AccountFormValues,
  type FormError,
  type FormErrors,
  type FormPreset,
  type SourceChoice,
} from './accountForm';
import { yourCurrencies } from './accountGroups';
import { useDeleteQuestion } from './useDeleteQuestion';
import {
  CARD_STYLES,
  useArchiveAccount,
  useSaveAccount,
  type Account,
  type AccountsOverview,
} from './accountsApi';

export type AccountDialogMode =
  { kind: 'new'; preset: FormPreset } | { kind: 'edit'; account: Account };

interface AccountDialogProps {
  mode: AccountDialogMode;
  opened: boolean;
  overview: AccountsOverview;
  onClose: () => void;
  /** After the API saved it; `added` for a new account. */
  onSaved: (account: Account, added: boolean) => void;
  /** After the API archived it (Archive at the end of the edit form, then yes). */
  onArchived: (account: Account) => void;
  /** After the API deleted it (Delete at the end of the edit form, then its name typed). */
  onDeleted: (account: Account) => void;
}

/**
 * New account and Edit (F-014, final prototype): the card as it will look with its four styles right under it,
 * then the name, currency, source (and bank), opening balance and date. The edit form ends with Archive and Delete
 * (I-011); each turns the dialog into its question. Mount it again (a new `key`) for each account: the form starts from `mode`.
 */
export function AccountDialog({
  mode,
  opened,
  overview,
  onClose,
  onSaved,
  onArchived,
  onDeleted,
}: AccountDialogProps) {
  const { t } = useTranslation();
  const save = useSaveAccount();
  const archive = useArchiveAccount();
  const [asking, setAsking] = useState<'archive' | 'delete' | null>(null);
  const account = mode.kind === 'edit' ? mode.account : undefined;
  const deleteQuestion = useDeleteQuestion(account, {
    onKeep: () => {
      setAsking(null);
    },
    onDeleted,
  });
  const endId = useId();
  const deleteTextId = useId();
  const hasTransactions = (account?.transactionCount ?? 0) > 0;
  const [values, setValues] = useState<AccountFormValues>(() =>
    account ? formFor(account) : blankForm(overview, mode.kind === 'new' ? mode.preset : {}),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const formId = useId();
  const form = useRef<HTMLFormElement>(null);

  const kind = sourceKind(values);
  const banks = overview.banks.map((b) => b.name);
  /** A mistake under its field, after an alert icon (the sign-in fields' style, F-011). */
  const errorText = (error: FormError | undefined): ReactNode =>
    error === undefined ? undefined : (
      <>
        <IconAlertCircle size={16} stroke={1.7} aria-hidden="true" />
        {error.key === 'tooLong'
          ? t('accounts.validation.tooLong', { max: error.max })
          : t(`accounts.validation.${error.key}`)}
      </>
    );

  /** Changes the form; a field's mistake goes away once it is edited. */
  const change = (next: AccountFormValues, field?: keyof FormErrors) => {
    setValues(next);
    if (field && errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const sourceLabel =
    kind === 'Cash'
      ? t('accounts.cash')
      : kind === 'Bank'
        ? (values.newBank ?? values.bank ?? '')
        : (values.newSource ??
          overview.sources.find((s) => `own:${s.id}` === values.source)?.name ??
          '');

  const submit = () => {
    const found = validateForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // The first mistake may be scrolled away (the phone): its field takes the focus, once it is marked
      requestAnimationFrame(() => {
        form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    if (save.isPending) return;
    save.mutate(
      { id: account?.id, body: toRequest(values, overview) },
      {
        onSuccess: (saved) => {
          onSaved(saved, !account);
        },
      },
    );
  };

  // The same dialog asks, so nothing closes and opens in between; Keep it (or the X) goes back to the form
  if (account && asking === 'delete') {
    return (
      <ResponsiveDialog
        opened={opened}
        onClose={deleteQuestion.keep}
        title={deleteQuestion.title}
        footer={deleteQuestion.footer}
      >
        {deleteQuestion.children}
      </ResponsiveDialog>
    );
  }

  if (account && asking === 'archive') {
    return (
      <ResponsiveDialog
        opened={opened}
        onClose={onClose}
        title={t('accounts.archive.title', { name: account.name })}
        footer={
          <>
            <Button variant="quiet" onClick={onClose}>
              {t('accounts.archive.cancel')}
            </Button>
            <Button
              loading={archive.isPending}
              leftSection={<IconArchive size={20} stroke={1.7} />}
              onClick={() => {
                archive.mutate(
                  { id: account.id },
                  {
                    onSuccess: () => {
                      onArchived(account);
                    },
                  },
                );
              }}
            >
              {t('accounts.archive.confirm')}
            </Button>
          </>
        }
      >
        <p className={classes.dialogText}>{t('accounts.archive.text')}</p>
        {account.balance !== 0 && (
          <div className={classes.infoBanner}>
            <IconInfoCircle size={20} stroke={1.7} aria-hidden />
            <p>
              {t('accounts.archive.stillHas', {
                amount: formatMoney(account.balance, account.currency),
                currency: account.currency,
              })}
            </p>
          </div>
        )}
        {archive.isError && (
          <p className={classes.formError} role="alert">
            {t('accounts.errors.save')}
          </p>
        )}
      </ResponsiveDialog>
    );
  }

  return (
    <ResponsiveDialog
      opened={opened}
      onClose={onClose}
      title={
        account ? t('accounts.form.editTitle', { name: account.name }) : t('accounts.form.newTitle')
      }
      footer={
        <div className={classes.formFooter}>
          <Button variant="quiet" onClick={onClose}>
            {t('accounts.form.cancel')}
          </Button>
          <Button type="submit" form={formId} loading={save.isPending}>
            {account ? t('accounts.form.save') : t('accounts.form.add')}
          </Button>
        </div>
      }
    >
      <form
        ref={form}
        id={formId}
        noValidate
        className={classes.form}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className={classes.styleBlock}>
          <div className={classes.preview} aria-hidden="true">
            <AccountCard
              name={values.name.trim() || t('accounts.form.cardName')}
              meta={sourceLabel}
              balance={previewBalance(values, account)}
              currency={values.currency}
              cardStyle={values.cardStyle}
            />
          </div>
          <Radio.Group
            name={`${formId}-style`}
            label={t('accounts.form.style')}
            value={values.cardStyle}
            onChange={(style) => {
              change({ ...values, cardStyle: style, styleSet: true });
            }}
            classNames={{ label: classes.styleLegend }}
          >
            <div className={classes.styleTiles}>
              {CARD_STYLES.map((style) => (
                <Radio.Card
                  key={style}
                  value={style}
                  withBorder={false}
                  className={classes.styleTile}
                >
                  <CardStyleMini cardStyle={style} />
                  {t(`accounts.form.styles.${style}`)}
                </Radio.Card>
              ))}
            </div>
          </Radio.Group>
        </div>

        <TextInput
          label={t('accounts.form.name')}
          description={errors.name ? undefined : t('accounts.form.nameHint')}
          value={values.name}
          maxLength={NAME_MAX}
          autoComplete="off"
          error={errorText(errors.name)}
          onChange={(event) => {
            change({ ...values, name: event.currentTarget.value }, 'name');
          }}
          inputWrapperOrder={['label', 'input', 'description', 'error']}
          classNames={{
            label: classes.label,
            input: classes.input,
            description: classes.hint,
            error: classes.error,
          }}
          data-autofocus={account ? undefined : true}
        />

        <CurrencyPicker
          label={t('accounts.form.currency')}
          sheetTitle={t('accounts.form.currency')}
          value={values.currency}
          onChange={(currency) => {
            change({ ...values, currency });
          }}
          currencies={overview.currencies}
          yours={yourCurrencies(overview)}
          hint={account ? t('accounts.form.currencyFixed') : undefined}
          // Its transactions are in its currency (F-018)
          disabled={hasTransactions}
        />

        <SourceField
          values={values}
          overview={overview}
          errors={errors}
          errorText={errorText}
          change={change}
        />

        {kind === 'Bank' && values.newSource === null && (
          <BankField
            values={values}
            banks={banks}
            errors={errors}
            errorText={errorText}
            change={change}
          />
        )}

        <TextInput
          label={t('accounts.form.opening')}
          description={errors.openingBalance ? undefined : t('accounts.form.openingHint')}
          value={values.openingBalance}
          inputMode="decimal"
          autoComplete="off"
          error={errorText(errors.openingBalance)}
          onChange={(event) => {
            change({ ...values, openingBalance: event.currentTarget.value }, 'openingBalance');
          }}
          onFocus={() => {
            change({ ...values, openingBalance: amountOnFocus(values.openingBalance) });
          }}
          onBlur={() => {
            change({ ...values, openingBalance: amountOnBlur(values.openingBalance) });
          }}
          rightSection={<span className={classes.affix}>{currencySign(values.currency)}</span>}
          rightSectionWidth={48}
          rightSectionPointerEvents="none"
          inputWrapperOrder={['label', 'input', 'description', 'error']}
          classNames={{
            label: classes.label,
            input: cx(classes.input, classes.amountInput),
            description: classes.hint,
            error: classes.error,
          }}
        />

        <DatePickerInput
          label={t('accounts.form.date')}
          value={values.openingDate}
          valueFormat="D MMM YYYY"
          error={errorText(errors.openingDate)}
          onChange={(date) => {
            change({ ...values, openingDate: date ?? '' }, 'openingDate');
          }}
          rightSection={
            <IconCalendar size={20} stroke={1.7} aria-label={t('accounts.form.pickDate')} />
          }
          rightSectionPointerEvents="none"
          classNames={{ label: classes.label, input: classes.input, error: classes.error }}
        />

        {save.isError && (
          <p className={classes.formError} role="alert">
            {t('accounts.errors.save')}
          </p>
        )}
      </form>

      {account && (
        <section className={classes.formEnd} aria-labelledby={endId}>
          <h3 id={endId} className={classes.formEndTitle}>
            {t('accounts.form.end.title')}
          </h3>
          <div className={classes.endRow}>
            <span className={classes.endName}>{t('accounts.form.end.archive')}</span>
            <span className={classes.endText}>{t('accounts.form.end.archiveText')}</span>
            <Button
              variant="quiet"
              className={classes.endButton}
              leftSection={<IconArchive size={20} stroke={1.7} />}
              onClick={() => {
                setAsking('archive');
              }}
            >
              {t('accounts.form.end.archive')}
            </Button>
          </div>
          <div className={classes.endRow}>
            <span className={classes.endName}>{t('accounts.form.end.delete')}</span>
            <span className={classes.endText} id={deleteTextId}>
              {hasTransactions
                ? t('accounts.form.end.deleteOff', { count: account.transactionCount })
                : t('accounts.form.end.deleteText')}
            </span>
            <Button
              // Only an account without transactions can be deleted; one with them can be archived (I-011)
              disabled={hasTransactions}
              aria-describedby={hasTransactions ? deleteTextId : undefined}
              variant="danger-quiet"
              className={classes.endButton}
              leftSection={<IconTrash size={20} stroke={1.7} />}
              onClick={() => {
                setAsking('delete');
              }}
            >
              {t('accounts.form.end.deleteButton')}
            </Button>
          </div>
        </section>
      )}
    </ResponsiveDialog>
  );
}

interface FieldProps {
  values: AccountFormValues;
  errors: FormErrors;
  errorText: (error: FormError | undefined) => ReactNode;
  change: (next: AccountFormValues, field?: keyof FormErrors) => void;
}

/** Cash, Bank and the person's own sources as pills, or a new source typed in. */
function SourceField({
  values,
  overview,
  errors,
  errorText,
  change,
}: FieldProps & { overview: AccountsOverview }) {
  const { t } = useTranslation();
  const name = useId();
  const typing = values.newSource !== null;
  const choices: { value: SourceChoice; label: string }[] = [
    { value: 'Cash', label: t('accounts.cash') },
    { value: 'Bank', label: t('accounts.bank') },
    ...overview.sources.map((s) => ({ value: `own:${s.id}` as const, label: s.name })),
  ];

  return (
    <Radio.Group
      name={name}
      label={t('accounts.form.source')}
      value={typing ? '' : values.source}
      onChange={(source) => {
        change(withSource(values, source as SourceChoice), 'newSource');
      }}
      classNames={{ label: classes.label }}
    >
      <div className={pills.pills}>
        {choices.map((choice) => (
          <Radio.Card
            key={choice.value}
            value={choice.value}
            withBorder={false}
            className={pills.pill}
          >
            {choice.label}
          </Radio.Card>
        ))}
        {!typing && (
          <UnstyledButton
            className={classes.newPill}
            onClick={() => {
              change(withNewSource(values, ''));
            }}
          >
            <IconPlus size={16} stroke={1.7} aria-hidden />
            {t('accounts.form.newSource')}
          </UnstyledButton>
        )}
      </div>
      {typing && (
        <div className={classes.newField}>
          <TextInput
            label={t('accounts.form.newSource')}
            description={errors.newSource ? undefined : t('accounts.form.newSourceHint')}
            value={values.newSource ?? ''}
            maxLength={SOURCE_NAME_MAX}
            autoComplete="off"
            autoFocus
            error={errorText(errors.newSource)}
            onChange={(event) => {
              change(withNewSource(values, event.currentTarget.value), 'newSource');
            }}
            inputWrapperOrder={['label', 'input', 'description', 'error']}
            classNames={{
              label: classes.label,
              input: classes.input,
              description: classes.hint,
              error: classes.error,
            }}
          />
          <UnstyledButton
            className={classes.textLink}
            onClick={() => {
              change({ ...values, newSource: null }, 'newSource');
            }}
          >
            {t('accounts.form.pickYours')}
          </UnstyledButton>
        </div>
      )}
    </Radio.Group>
  );
}

/** The person's banks as pills, or a bank's name typed in, with common banks suggested. */
function BankField({ values, banks, errors, errorText, change }: FieldProps & { banks: string[] }) {
  const { t } = useTranslation();
  const name = useId();
  const typing = values.newBank !== null;
  const suggestions = typing ? bankSuggestions(values.newBank ?? '', banks) : [];

  return (
    <Radio.Group
      name={name}
      label={t('accounts.form.bank')}
      value={typing ? '' : (values.bank ?? '')}
      onChange={(bank) => {
        change({ ...values, bank, newBank: null }, 'bank');
      }}
      error={typing ? undefined : errorText(errors.bank)}
      classNames={{ label: classes.label, error: classes.error }}
    >
      {(banks.length > 0 || !typing) && (
        <div className={pills.pills}>
          {banks.map((bank) => (
            <Radio.Card key={bank} value={bank} withBorder={false} className={pills.pill}>
              {bank}
            </Radio.Card>
          ))}
          {!typing && (
            <UnstyledButton
              className={classes.newPill}
              onClick={() => {
                change({ ...values, newBank: '' });
              }}
            >
              <IconPlus size={16} stroke={1.7} aria-hidden />
              {t('accounts.form.anotherBank')}
            </UnstyledButton>
          )}
        </div>
      )}
      {typing && (
        <div className={banks.length > 0 ? classes.newField : undefined}>
          <TextInput
            label={t('accounts.form.bankName')}
            description={errors.bank ? undefined : t('accounts.form.bankHint')}
            value={values.newBank ?? ''}
            maxLength={BANK_NAME_MAX}
            autoComplete="off"
            autoFocus={banks.length > 0}
            error={errorText(errors.bank)}
            onChange={(event) => {
              change({ ...values, newBank: event.currentTarget.value }, 'bank');
            }}
            inputWrapperOrder={['label', 'input', 'description', 'error']}
            classNames={{
              label: classes.label,
              input: classes.input,
              description: classes.hint,
              error: classes.error,
            }}
          />
          {suggestions.length > 0 && (
            <>
              <p className={classes.suggestLabel}>{t('accounts.form.suggestions')}</p>
              <div className={classes.suggest}>
                {suggestions.map((bank) => (
                  <UnstyledButton
                    key={bank}
                    className={classes.suggestion}
                    onClick={() => {
                      change({ ...values, newBank: bank }, 'bank');
                    }}
                  >
                    {bank}
                  </UnstyledButton>
                ))}
              </div>
            </>
          )}
          {banks.length > 0 && (
            <UnstyledButton
              className={classes.textLink}
              onClick={() => {
                change({ ...values, newBank: null }, 'bank');
              }}
            >
              {t('accounts.form.pickYours')}
            </UnstyledButton>
          )}
        </div>
      )}
    </Radio.Group>
  );
}
