import { ActionIcon, Input, TextInput, UnstyledButton } from '@mantine/core';
import { IconSearch, IconSelector, IconX } from '@tabler/icons-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FadingScrollArea } from '../../shared/ui/FadingScrollArea';
import classes from './Accounts.module.css';
import { useCurrencyName } from './currencyNames';

interface CurrencyFieldProps {
  value: string;
  onChange: (code: string) => void;
  /** Every currency an account can be in (from the API). */
  currencies: readonly string[];
  /** The person's own currencies, listed first. */
  yours: readonly string[];
  hint?: string;
}

/**
 * The currency: a button that opens a searchable list inside the form, the person's currencies first, then every
 * NBU currency. The search matches the code or the name (F-014).
 */
export function CurrencyField({ value, onChange, currencies, yours, hint }: CurrencyFieldProps) {
  const { t } = useTranslation();
  const currencyName = useCurrencyName();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const button = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  // The list opens in view, with the search in focus, so typing filters right away
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    panel.current?.scrollIntoView({ block: 'nearest' });
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
    button.current?.focus();
  };

  // Escape closes the list, not the whole form: the dialog leaves keys from elements marked with
  // `data-mantine-stop-propagation` alone
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  };
  const keepDialogOpen = { 'data-mantine-stop-propagation': true };

  const q = query.trim().toLocaleLowerCase();
  const matches = (code: string) =>
    !q ||
    code.toLocaleLowerCase().includes(q) ||
    currencyName(code).toLocaleLowerCase().includes(q);
  const mine = yours.filter(matches);
  const rest = currencies
    .filter((c) => !yours.includes(c) && matches(c))
    .sort((a, b) => a.localeCompare(b));

  const item = (code: string) => (
    <li key={code}>
      <UnstyledButton
        className={classes.pickItem}
        aria-pressed={code === value}
        {...keepDialogOpen}
        onClick={() => {
          onChange(code);
          close();
        }}
      >
        <b>{code}</b>
        <span>{currencyName(code)}</span>
      </UnstyledButton>
    </li>
  );

  return (
    <Input.Wrapper
      label={t('accounts.form.currency')}
      labelProps={{ htmlFor: `${id}-button` }}
      description={hint}
      inputWrapperOrder={['label', 'input', 'description', 'error']}
      classNames={{ label: classes.label, description: classes.hint }}
    >
      <UnstyledButton
        ref={button}
        id={`${id}-button`}
        className={classes.pickButton}
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        onClick={() => {
          if (open) close();
          else setOpen(true);
        }}
      >
        <b>{value}</b>
        <span className={classes.pickWhat}>{currencyName(value)}</span>
        <IconSelector size={20} stroke={1.7} aria-hidden />
      </UnstyledButton>
      {open && (
        <div className={classes.picker} id={`${id}-list`} ref={panel} onKeyDown={onKeyDown}>
          <TextInput
            type="search"
            aria-label={t('accounts.picker.search')}
            placeholder={t('accounts.picker.placeholder')}
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}
            leftSection={<IconSearch size={20} stroke={1.7} />}
            rightSection={
              <ActionIcon
                variant="subtle"
                color="gray"
                radius="xl"
                size={40}
                aria-label={t('accounts.picker.close')}
                onClick={close}
                {...keepDialogOpen}
              >
                <IconX size={20} stroke={1.7} />
              </ActionIcon>
            }
            rightSectionWidth={48}
            classNames={{ root: classes.pickSearch, input: classes.pickSearchInput }}
            autoComplete="off"
            ref={search}
            {...keepDialogOpen}
          />
          <FadingScrollArea autosize mah={248} className={classes.pickScroll}>
            {mine.length === 0 && rest.length === 0 ? (
              <p className={classes.pickNone}>
                {t('accounts.picker.none', { query: query.trim() })}
              </p>
            ) : (
              <>
                {mine.length > 0 && (
                  <>
                    <h3 className={classes.pickHeading} id={`${id}-yours`}>
                      {t('accounts.picker.yours')}
                    </h3>
                    <ul className={classes.pickList} aria-labelledby={`${id}-yours`}>
                      {mine.map(item)}
                    </ul>
                  </>
                )}
                {rest.length > 0 && (
                  <>
                    <h3 className={classes.pickHeading} id={`${id}-all`}>
                      {t('accounts.picker.all')}
                    </h3>
                    <ul className={classes.pickList} aria-labelledby={`${id}-all`}>
                      {rest.map(item)}
                    </ul>
                  </>
                )}
              </>
            )}
          </FadingScrollArea>
        </div>
      )}
    </Input.Wrapper>
  );
}
