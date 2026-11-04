import { ActionIcon, TextInput, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import type { CategoryOption } from './formDefaults';
import { Picker } from './Picker';
import { KEEP_FORM_OPEN } from './transactionForm';
import pillClasses from '../../shared/ui/Pills.module.css';
import classes from './TransactionForm.module.css';

interface CategoryFieldProps {
  /** The picked category's id, or null. */
  value: string | null;
  onChange: (categoryId: string) => void;
  /** The pills: the most used, a picked one first. */
  pills: CategoryOption[];
  /** Every category of the type, in the report's order, for "All categories". */
  all: CategoryOption[];
  /** The most used, listed first under "Often" in "All categories". */
  often: CategoryOption[];
  /** "Pick a category.", next to the label (owner, 2026-11-01). */
  error?: string;
}

/**
 * The category (F-018 final prototype): the most used as pills that wrap, and "All categories" with a search, a
 * dropdown on the desktop and a sheet on the phone. Picking one doesn't save (owner, 2026-11-01).
 */
export function CategoryField({ value, onChange, pills, all, often, error }: CategoryFieldProps) {
  const { t } = useTranslation();
  const headingId = useId();
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const more = all.length > pills.length;

  // The search is in focus as the list opens, so typing filters right away
  useEffect(() => {
    if (open) search.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const searchField = (
    <TextInput
      ref={search}
      type="search"
      aria-label={t('transactions.form.searchCategories')}
      placeholder={t('transactions.form.searchPlaceholder')}
      value={query}
      onChange={(event) => {
        setQuery(event.currentTarget.value);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') close();
      }}
      leftSection={<IconSearch size={20} stroke={1.7} />}
      rightSection={
        isDesktop ? (
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={t('transactions.form.closeList')}
            onClick={close}
            {...KEEP_FORM_OPEN}
          >
            <IconX size={20} stroke={1.7} />
          </ActionIcon>
        ) : undefined
      }
      rightSectionWidth={48}
      classNames={{ input: classes.searchInput }}
      autoComplete="off"
      data-autofocus
      {...KEEP_FORM_OPEN}
    />
  );

  return (
    <div className={classes.block}>
      <div className={classes.blockHead}>
        <span className={classes.labelRow}>
          <h3 className={classes.label} id={headingId}>
            {t('transactions.form.category')}
          </h3>
          {error && (
            <p className={classes.inlineError} id={`${headingId}-error`}>
              <IconAlertCircle size={16} stroke={1.7} aria-hidden />
              {error}
            </p>
          )}
        </span>
        {more && (
          <Picker
            opened={open}
            onClose={close}
            title={t('transactions.form.category')}
            position="bottom-end"
            width={320}
            tall
            top={searchField}
            // As tall as its rows up to 344 px with the search (the currency list's)
            listHeight={272}
            target={
              <UnstyledButton
                className={classes.textLink}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => {
                  if (open) close();
                  else setOpen(true);
                }}
              >
                {t('transactions.form.allCategories')}
                <IconChevronDown size={16} stroke={1.7} aria-hidden />
              </UnstyledButton>
            }
          >
            <CategoryList
              value={value}
              all={all}
              often={often}
              query={query}
              onPick={(id) => {
                onChange(id);
                close();
              }}
            />
          </Picker>
        )}
      </div>
      <div
        className={pillClasses.pills}
        role="radiogroup"
        aria-labelledby={headingId}
        aria-describedby={error ? `${headingId}-error` : undefined}
      >
        {pills.map((category) => (
          <UnstyledButton
            key={category.id}
            role="radio"
            className={pillClasses.pill}
            aria-checked={category.id === value}
            onClick={() => {
              onChange(category.id);
            }}
          >
            {category.id === value && <IconCheck size={16} stroke={1.7} aria-hidden />}
            {category.name}
          </UnstyledButton>
        ))}
      </div>
    </div>
  );
}

interface CategoryListProps {
  value: string | null;
  all: CategoryOption[];
  often: CategoryOption[];
  query: string;
  onPick: (categoryId: string) => void;
}

/** Often, then every group; the search matches a category's name or its group's ("sub" finds Subscriptions). */
function CategoryList({ value, all, often, query, onPick }: CategoryListProps) {
  const { t } = useTranslation();
  const id = useId();

  const q = query.trim().toLocaleLowerCase();
  const matches = (category: CategoryOption) =>
    !q ||
    category.name.toLocaleLowerCase().includes(q) ||
    category.group.toLocaleLowerCase().includes(q);
  const groups = [...new Set(all.map((category) => category.group))]
    .map((group) => ({
      group,
      categories: all.filter((category) => category.group === group && matches(category)),
    }))
    .filter((section) => section.categories.length > 0);
  const sections = [
    ...(q || often.length === 0
      ? []
      : [{ group: t('transactions.form.often'), categories: often }]),
    ...groups,
  ];

  if (sections.length === 0) {
    return (
      <p className={classes.none}>{t('transactions.form.noCategory', { query: query.trim() })}</p>
    );
  }

  return sections.map((section, index) => (
    <div key={section.group}>
      <h3 className={classes.listHeading} id={`${id}-${String(index)}`}>
        {section.group}
      </h3>
      <ul className={classes.list} aria-labelledby={`${id}-${String(index)}`}>
        {section.categories.map((category) => (
          <li key={category.id}>
            <UnstyledButton
              className={classes.listItem}
              aria-pressed={category.id === value}
              onClick={() => {
                onPick(category.id);
              }}
              {...KEEP_FORM_OPEN}
            >
              <span className={classes.listName}>{category.name}</span>
              {category.id === value && <IconCheck size={20} stroke={1.7} aria-hidden />}
            </UnstyledButton>
          </li>
        ))}
      </ul>
    </div>
  ));
}
