import {
  ActionIcon,
  Input,
  Popover,
  TextInput,
  UnstyledButton,
  VisuallyHidden,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconCheck,
  IconChevronDown,
  IconCoins,
  IconSearch,
  IconSelector,
  IconX,
} from '@tabler/icons-react';
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import { useCurrencyName } from '../i18n/currencyNames';
import { BottomSheet } from './BottomSheet';
import { FadingScrollArea } from './FadingScrollArea';
import classes from './CurrencyPicker.module.css';
import pills from './Pills.module.css';

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
  /**
   * A filter pill instead of the field (the Reports page, F-022): an icon, the code and a chevron, with the label only
   * for screen readers; the list opens 300 px wide under the pill's end.
   */
  pill?: boolean;
}

/**
 * A currency field (F-016): a button that opens the list of currencies, the person's own first, then every NBU
 * currency, with a search by code or name. On the desktop a dropdown floating under the button, over the page or
 * the dialog, as tall as its rows; on the phone a sheet. Every currency field uses it (Settings, the account form, the
 * Reports page's pill).
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
  pill = false,
}: CurrencyPickerProps) {
  const { t } = useTranslation();
  const currencyName = useCurrencyName();
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  /**
   * The row ↓ ↑ or the pointer marked, for the search it was marked in: a letter typed makes another search, which
   * leaves the mark to its first match (B-004).
   */
  const [active, setActive] = useState<{ query: string; code: string } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const matchesOf = useMatches(currencies, yours);
  const { mine, rest } = matchesOf(query);
  // While typing, the first match is marked until ↓ ↑ or the pointer mark another: "pln" and Enter picks PLN
  const markedIn = (text: string, rows: readonly string[]) =>
    active?.query === text && rows.includes(active.code)
      ? active.code
      : text.trim()
        ? (rows[0] ?? null)
        : null;
  const activeRow = markedIn(query, [...mine, ...rest]);

  // The search is in focus as the list opens, so typing filters right away. As it is drawn, not when `open` turns
  // true: the desktop dropdown appears a frame later, after its transition starts, and had no search to focus (B-004)
  const focusSearch = useCallback((node: HTMLInputElement | null) => {
    node?.focus({ preventScroll: true });
  }, []);

  const close = () => {
    setOpen(false);
    setQuery('');
    setActive(null);
    button.current?.focus();
  };
  const pick = (code: string) => {
    onChange(code);
    close();
  };

  // Escape closes the list, not the dialog or sheet under it: they leave keys from elements marked with
  // `data-mantine-stop-propagation` alone. ↓ ↑ move the mark, Enter picks the marked row
  const keepDialogOpen = { 'data-mantine-stop-propagation': true };
  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') close();
    // From what the search holds, not from the last render: a key pressed right after a letter may come first
    const typed = event.currentTarget.value;
    const found = matchesOf(typed);
    const all = [...found.mine, ...found.rest];
    const marked = markedIn(typed, all);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const at = marked === null ? -1 : all.indexOf(marked);
      const next =
        event.key === 'ArrowDown' ? Math.min(at + 1, all.length - 1) : Math.max(at - 1, 0);
      const code = all[next];
      if (code !== undefined) setActive({ query: typed, code });
    }
    if (event.key === 'Enter') {
      // Picks, doesn't send the form the dialog holds
      event.preventDefault();
      if (marked !== null) pick(marked);
    }
  };

  const searchField = (
    <TextInput
      ref={focusSearch}
      // The phone's sheet focuses its first field once it opens: without this its × button (B-004)
      data-autofocus
      type="search"
      aria-label={t('currencyPicker.search')}
      aria-controls={`${id}-list`}
      aria-activedescendant={activeRow === null ? undefined : `${id}-list-row-${activeRow}`}
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
      id={`${id}-list`}
      value={value}
      mine={mine}
      rest={rest}
      query={query}
      activeRow={activeRow}
      onMark={(code) => {
        setActive({ query, code });
      }}
      onPick={pick}
      itemProps={keepDialogOpen}
    />
  );

  const shown = placeholder === undefined;
  const target = pill ? (
    <UnstyledButton
      ref={button}
      className={pills.select}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-label={`${label}: ${value}, ${currencyName(value)}`}
      onClick={() => {
        if (open) close();
        else setOpen(true);
      }}
    >
      <IconCoins size={16} stroke={1.7} aria-hidden />
      <span>{value}</span>
      <IconChevronDown size={16} stroke={1.7} aria-hidden />
    </UnstyledButton>
  ) : (
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
          setActive(null);
        }
      }}
      position={pill ? 'bottom-end' : 'bottom-start'}
      offset={8}
      // Always under the button, as approved: with little room below it gets shorter and scrolls instead of
      // turning up over the field's label
      middlewares={{ flip: false, shift: false, size: { padding: 16 } }}
      width={pill ? 300 : 'target'}
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
        {/* As tall as its rows up to 344 px with the search; then it scrolls (owner, 2026-10-31), the bar in a gutter
            of its own beside the rows (B-005) */}
        <FadingScrollArea autosize mah={272} offsetScrollbars="present" className={classes.scroll}>
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

  return hideLabel || pill ? (
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

/**
 * The currencies a search finds: the person's first, then every other one by code; it matches the code or the name.
 */
function useMatches(currencies: readonly string[], yours: readonly string[]) {
  const currencyName = useCurrencyName();
  return (query: string) => {
    const q = query.trim().toLocaleLowerCase();
    const matches = (code: string) =>
      !q ||
      code.toLocaleLowerCase().includes(q) ||
      currencyName(code).toLocaleLowerCase().includes(q);
    return {
      mine: yours.filter(matches),
      rest: currencies
        .filter((code) => !yours.includes(code) && matches(code))
        .sort((a, b) => a.localeCompare(b)),
    };
  };
}

interface CurrencyListProps {
  /** The rows' ids start with it: the search points at the marked one (`aria-activedescendant`). */
  id: string;
  value: string;
  mine: readonly string[];
  rest: readonly string[];
  query: string;
  /** The row Enter picks: the first match while typing, or the one ↓ ↑ or the pointer marked (B-004). */
  activeRow: string | null;
  onMark: (code: string) => void;
  onPick: (code: string) => void;
  itemProps: { 'data-mantine-stop-propagation': boolean };
}

/** The matches, under the headings Yours and All NBU currencies. */
function CurrencyList({
  id,
  value,
  mine,
  rest,
  query,
  activeRow,
  onMark,
  onPick,
  itemProps,
}: CurrencyListProps) {
  const { t } = useTranslation();
  const currencyName = useCurrencyName();
  const list = useRef<HTMLDivElement>(null);

  // The marked row stays in sight while ↓ ↑ move it
  useEffect(() => {
    if (activeRow !== null)
      list.current
        ?.querySelector(`[data-code="${activeRow}"]`)
        ?.scrollIntoView({ block: 'nearest' });
  }, [activeRow]);

  if (mine.length === 0 && rest.length === 0) {
    return <p className={classes.none}>{t('currencyPicker.none', { query: query.trim() })}</p>;
  }

  const item = (code: string) => (
    <li key={code}>
      <UnstyledButton
        id={`${id}-row-${code}`}
        data-code={code}
        className={classes.item}
        data-active={code === activeRow ? true : undefined}
        aria-pressed={code === value}
        // A mouse marks the row it moves over; a finger doesn't (a tap's place would take the mark from ↓ ↑)
        onPointerMove={(event) => {
          if (event.pointerType === 'mouse' && code !== activeRow) onMark(code);
        }}
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
    <div ref={list} id={id} className={classes.list}>
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
