import {
  ActionIcon,
  Input,
  Popover,
  TextInput,
  UnstyledButton,
  VisuallyHidden,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconCheck, IconSearch, IconSelector, IconX } from '@tabler/icons-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import { useCurrencyName } from '../i18n/currencyNames';
import { BottomSheet } from './BottomSheet';
import { FadingScrollArea } from './FadingScrollArea';
import classes from './CurrencyPicker.module.css';

interface CurrencyPickerProps {
  /** The picked currency: marked in the list, and on the button unless `placeholder` shows instead. */
  value: string;
  onChange: (code: string) => void;
  /** Every currency there is to pick (from the API). */
  currencies: readonly string[];
  /** The person's own currencies, listed first. */
  yours: readonly string[];
  /** The field's name; above the button, or with `hideLabel` only for screen readers. */
  label: string;
  hideLabel?: boolean;
  /** Shown on the button instead of the value (Settings: "Another currency" while one of the three is picked). */
  placeholder?: string;
  /** The button marked like a picked choice: the accent and a check (Settings, a currency from the list). */
  marked?: boolean;
  hint?: string;
  /** Shown but not changeable (an account with transactions keeps its currency, F-018). */
  disabled?: boolean;
  /** The phone sheet's title. */
  sheetTitle: string;
}

/**
 * A currency field (F-016): a button that opens the list of currencies, the person's own first, then every NBU
 * currency, with a search by code or name. On the desktop a dropdown floating under the button, over the page or
 * the dialog, as tall as its rows; on the phone a sheet. Every currency field uses it (Settings, the account form).
 */
export function CurrencyPicker({
  value,
  onChange,
  currencies,
  yours,
  label,
  hideLabel,
  placeholder,
  marked,
  hint,
  disabled,
  sheetTitle,
}: CurrencyPickerProps) {
  const { t } = useTranslation();
  const currencyName = useCurrencyName();
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const button = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const id = useId();

  // The search is in focus as the list opens, so typing filters right away
  useEffect(() => {
    if (open) search.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
    button.current?.focus();
  };
  const pick = (code: string) => {
    onChange(code);
    close();
  };

  // Escape closes the list, not the dialog or sheet under it: they leave keys from elements marked with
  // `data-mantine-stop-propagation` alone
  const keepDialogOpen = { 'data-mantine-stop-propagation': true };
  const onSearchKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  };

  const searchField = (
    <TextInput
      ref={search}
      type="search"
      aria-label={t('currencyPicker.search')}
      placeholder={t('currencyPicker.placeholder')}
      value={query}
      onChange={(event) => {
        setQuery(event.currentTarget.value);
      }}
      onKeyDown={onSearchKey}
      leftSection={<IconSearch size={20} stroke={1.7} />}
      rightSection={
        isDesktop ? (
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={t('currencyPicker.close')}
            onClick={close}
            {...keepDialogOpen}
          >
            <IconX size={20} stroke={1.7} />
          </ActionIcon>
        ) : undefined
      }
      rightSectionWidth={48}
      classNames={{ input: classes.searchInput }}
      autoComplete="off"
      {...keepDialogOpen}
    />
  );
  const list = (
    <CurrencyList
      value={value}
      currencies={currencies}
      yours={yours}
      query={query}
      onPick={pick}
      itemProps={keepDialogOpen}
    />
  );

  const shown = placeholder === undefined;
  const target = (
    <UnstyledButton
      ref={button}
      id={`${id}-button`}
      className={classes.button}
      data-marked={marked ? true : undefined}
      disabled={disabled}
      aria-expanded={open}
      aria-haspopup="dialog"
      onClick={() => {
        if (open) close();
        else setOpen(true);
      }}
    >
      {shown ? (
        <>
          {hideLabel && <VisuallyHidden>{`${label}: `}</VisuallyHidden>}
          <b>{value}</b>
          <span className={classes.what}>{currencyName(value)}</span>
          {marked && <IconCheck className={classes.check} size={20} stroke={1.7} aria-hidden />}
        </>
      ) : (
        <span className={classes.placeholder}>{placeholder}</span>
      )}
      <IconSelector className={classes.selector} size={20} stroke={1.7} aria-hidden />
    </UnstyledButton>
  );

  const field = isDesktop ? (
    <Popover
      opened={open}
      // A click outside closes it where the click went; Escape gives the focus back to the button
      onChange={(opened) => {
        if (!opened) {
          setOpen(false);
          setQuery('');
        }
      }}
      position="bottom-start"
      offset={8}
      // Always under the button, as approved: with little room below it gets shorter and scrolls instead of
      // turning up over the field's label
      middlewares={{ flip: false, shift: false, size: { padding: 16 } }}
      width="target"
      withinPortal
      // Its roles would give the button another id and lose the label; the button says aria-expanded itself
      withRoles={false}
      returnFocus
      closeOnEscape
      classNames={{ dropdown: classes.dropdown }}
    >
      <Popover.Target>{target}</Popover.Target>
      <Popover.Dropdown aria-label={sheetTitle} role="dialog">
        <div className={classes.dropdownSearch}>{searchField}</div>
        {/* As tall as its rows up to 344 px with the search; then it scrolls (owner, 2026-10-31) */}
        <FadingScrollArea autosize mah={272} className={classes.scroll}>
          {list}
        </FadingScrollArea>
      </Popover.Dropdown>
    </Popover>
  ) : (
    <>
      {target}
      <BottomSheet opened={open} onClose={close} title={sheetTitle} top={searchField} tall>
        {list}
      </BottomSheet>
    </>
  );

  return hideLabel ? (
    field
  ) : (
    <Input.Wrapper
      label={label}
      labelProps={{ htmlFor: `${id}-button` }}
      description={hint}
      inputWrapperOrder={['label', 'input', 'description', 'error']}
      classNames={{ label: classes.label, description: classes.hint }}
    >
      {field}
    </Input.Wrapper>
  );
}

interface CurrencyListProps {
  value: string;
  currencies: readonly string[];
  yours: readonly string[];
  query: string;
  onPick: (code: string) => void;
  itemProps: { 'data-mantine-stop-propagation': boolean };
}

/** The person's currencies first, then every other one by code; the search matches the code or the name. */
function CurrencyList({ value, currencies, yours, query, onPick, itemProps }: CurrencyListProps) {
  const { t } = useTranslation();
  const currencyName = useCurrencyName();
  const id = useId();

  const q = query.trim().toLocaleLowerCase();
  const matches = (code: string) =>
    !q ||
    code.toLocaleLowerCase().includes(q) ||
    currencyName(code).toLocaleLowerCase().includes(q);
  const mine = yours.filter(matches);
  const rest = currencies
    .filter((code) => !yours.includes(code) && matches(code))
    .sort((a, b) => a.localeCompare(b));

  if (mine.length === 0 && rest.length === 0) {
    return <p className={classes.none}>{t('currencyPicker.none', { query: query.trim() })}</p>;
  }

  const item = (code: string) => (
    <li key={code}>
      <UnstyledButton
        className={classes.item}
        aria-pressed={code === value}
        onClick={() => {
          onPick(code);
        }}
        {...itemProps}
      >
        <b>{code}</b>
        <span>{currencyName(code)}</span>
      </UnstyledButton>
    </li>
  );

  return (
    <div className={classes.list}>
      {mine.length > 0 && (
        <>
          <h3 className={classes.heading} id={`${id}-yours`}>
            {t('currencyPicker.yours')}
          </h3>
          <ul className={classes.items} aria-labelledby={`${id}-yours`}>
            {mine.map(item)}
          </ul>
        </>
      )}
      {rest.length > 0 && (
        <>
          <h3 className={classes.heading} id={`${id}-all`}>
            {t('currencyPicker.all')}
          </h3>
          <ul className={classes.items} aria-labelledby={`${id}-all`}>
            {rest.map(item)}
          </ul>
        </>
      )}
    </div>
  );
}
