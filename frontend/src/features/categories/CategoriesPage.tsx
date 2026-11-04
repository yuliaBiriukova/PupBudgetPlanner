import { Button, Skeleton, Title, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconAlertCircle, IconChevronDown, IconInfoCircle, IconRefresh } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '../../shared/ui/cx';
import classes from './Categories.module.css';
import { categoriesQuery, type CategoryGroup } from './categoriesApi';
import { openGroups, readOpen, writeOpen } from './openGroups';

/** Mantine's `lg` breakpoint: from here the list of groups sits beside the picked group's categories. */
const WIDE_QUERY = '(min-width: 75em)';

/** "Rent, Bills, Home supplies and 6 more" for a folded group or a row in the list of groups. */
function usePreview() {
  const { t } = useTranslation();

  return (group: CategoryGroup) => {
    const names = group.categories.map((category) => category.name);
    if (names.length === 0) return t('categories.none');
    if (names.length === 1) return names[0];
    if (names.length <= 4)
      return t('categories.previewAll', {
        first: names.slice(0, -1).join(', '),
        last: names.at(-1),
      });
    return t('categories.previewMore', {
      first: names.slice(0, 3).join(', '),
      count: names.length - 3,
    });
  };
}

function Tags({ group, id, animate }: { group: CategoryGroup; id?: string; animate?: boolean }) {
  return (
    <ul className={cx(classes.tags, animate && classes.tagsIn)} id={id}>
      {group.categories.map((category) => (
        <li key={category.id}>{category.name}</li>
      ))}
    </ul>
  );
}

/**
 * Categories (F-015, final prototype variant 7): read-only. On the phone and tablet every group with its categories
 * as tags, folded except the open ones (any number); on the desktop the list of groups and one group's tags beside
 * it. Both layouts share the open groups, remembered on the device (owner's review, 2026-10-31).
 */
export function CategoriesPage() {
  const { t } = useTranslation();
  const categories = useQuery(categoriesQuery);
  const isWide = useMediaQuery(WIDE_QUERY, false, { getInitialValueInEffect: false });
  const [stored, setStored] = useState(readOpen);
  // The group just opened: its tags come out of its row, or in from the right on the desktop
  const [fresh, setFresh] = useState<string>();

  const head = (
    <header className={classes.head}>
      <Title order={1}>{t('nav.categories')}</Title>
    </header>
  );

  if (categories.isPending) {
    return (
      <>
        {head}
        <div role="status" aria-busy="true" aria-label={t('categories.loading')}>
          {[3, 6, 4].map((tags, group) => (
            <div key={group} className={classes.group}>
              <Skeleton height={16} width={[90, 140, 100][group]} radius="sm" my={16} />
              <div className={classes.tags}>
                {Array.from({ length: tags }, (_, tag) => (
                  <Skeleton
                    key={tag}
                    height={36}
                    width={[72, 96, 64, 110, 80, 70][tag]}
                    radius="xl"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (categories.isError) {
    return (
      <>
        {head}
        <div className={classes.errorBanner} role="alert">
          <IconAlertCircle size={20} stroke={1.7} aria-hidden />
          <div>
            <p>{t('categories.errors.load')}</p>
            <UnstyledButton
              className={classes.textLink}
              style={{ color: 'inherit' }}
              onClick={() => {
                void categories.refetch();
              }}
            >
              <IconRefresh size={20} stroke={1.7} aria-hidden />
              {t('categories.errors.retry')}
            </UnstyledButton>
          </div>
        </div>
      </>
    );
  }

  const { groups } = categories.data;
  if (groups.length === 0) {
    return (
      <>
        {head}
        <div className={classes.emptyBox}>
          <h2 className={classes.emptyTitle}>{t('categories.empty.title')}</h2>
          <p className={classes.dim}>{t('categories.empty.text')}</p>
          <Button
            mt={18}
            leftSection={<IconRefresh size={20} stroke={1.7} />}
            onClick={() => {
              void categories.refetch();
            }}
          >
            {t('categories.errors.retry')}
          </Button>
        </div>
      </>
    );
  }

  const total = groups.reduce((sum, group) => sum + group.categories.length, 0);
  const summary = t('categories.summary', {
    categories: t('categories.count', { count: total }),
    groups: t('categories.groupCount', { count: groups.length }),
  });

  const open = openGroups(
    stored,
    groups.map((group) => group.id),
  );
  const setOpen = (next: string[], opened?: string) => {
    setStored(next);
    writeOpen(next);
    setFresh(opened);
  };
  const props = { groups, summary, open, setOpen, fresh };

  return (
    <>
      {head}
      {isWide ? <GroupsBeside {...props} /> : <FoldingGroups {...props} />}
      <p className={classes.later}>
        <IconInfoCircle size={16} stroke={1.7} aria-hidden />
        {t('categories.later')}
      </p>
    </>
  );
}

interface GroupsProps {
  groups: CategoryGroup[];
  summary: string;
  /** The open groups, the most recently opened last. */
  open: string[];
  setOpen: (open: string[], opened?: string) => void;
  /** The group just opened by a tap or click. */
  fresh?: string;
}

/**
 * Phone and tablet: every group, folded except the open ones; any number can be open. Income first, then the
 * expenses under their label.
 */
function FoldingGroups({ groups, summary, open, setOpen, fresh }: GroupsProps) {
  const { t } = useTranslation();
  const preview = usePreview();

  const allFolded = open.length === 0;
  const expenses = groups.filter((group) => group.kind === 'Expense');
  const expenseCount = expenses.reduce((sum, group) => sum + group.categories.length, 0);

  const renderGroup = (group: CategoryGroup) => {
    const isOpen = open.includes(group.id);
    const tagsId = `category-group-${group.id}`;
    return (
      <section
        key={group.id}
        className={classes.group}
        data-kind={group.kind}
        data-folded={isOpen ? undefined : true}
      >
        <h2 className={classes.groupHeading}>
          <UnstyledButton
            className={classes.groupButton}
            aria-expanded={isOpen}
            aria-controls={isOpen ? tagsId : undefined}
            onClick={() => {
              if (isOpen) {
                setOpen(open.filter((id) => id !== group.id));
              } else {
                setOpen([...open, group.id], group.id);
              }
            }}
          >
            <span className={classes.groupText}>
              <span className={classes.groupName}>{group.name}</span>
              {!isOpen && <span className={classes.preview}>{preview(group)}</span>}
            </span>
            <span className={cx(classes.count, classes.num)}>{group.categories.length}</span>
            <IconChevronDown className={classes.chevron} size={20} stroke={1.7} aria-hidden />
          </UnstyledButton>
        </h2>
        {isOpen && <Tags group={group} id={tagsId} animate={fresh === group.id} />}
      </section>
    );
  };

  return (
    <>
      <div className={classes.bar}>
        <span>{summary}</span>
        <UnstyledButton
          className={classes.textLink}
          onClick={() => {
            // The first group comes last, so the desktop shows it, as it does when nothing is open
            setOpen(allFolded ? groups.map((group) => group.id).reverse() : []);
          }}
        >
          {allFolded ? t('categories.expandAll') : t('categories.collapseAll')}
        </UnstyledButton>
      </div>
      {groups.filter((group) => group.kind === 'Income').map(renderGroup)}
      {expenses.length > 0 && (
        <p className={classes.kindLabel}>
          <span>{t('categories.expenses')}</span>
          <span className={classes.num}>{t('categories.count', { count: expenseCount })}</span>
        </p>
      )}
      {expenses.map(renderGroup)}
    </>
  );
}

/**
 * Desktop: the list of groups on the left, one group's categories as bigger tags on the right: the last one opened,
 * or the first group. Picking one makes it the only open group, so the phone shows just that one open.
 */
function GroupsBeside({ groups, summary, open, setOpen, fresh }: GroupsProps) {
  const { t } = useTranslation();
  const preview = usePreview();
  const group = groups.find((g) => g.id === open.at(-1)) ?? groups[0];
  if (!group) return null;
  const kindWord = t(`categories.kind.${group.kind}`);
  const count = t('categories.count', { count: group.categories.length });

  const button = (g: CategoryGroup) => (
    <li key={g.id}>
      <UnstyledButton
        className={classes.indexButton}
        aria-current={g.id === group.id}
        onClick={() => {
          setOpen([g.id], g.id);
        }}
      >
        <span className={classes.groupText}>
          <span className={classes.groupName}>{g.name}</span>
          <span className={classes.preview}>{preview(g)}</span>
        </span>
      </UnstyledButton>
    </li>
  );
  const expenses = groups.filter((g) => g.kind === 'Expense');

  return (
    <>
      <p className={classes.intro}>{t('categories.intro', { summary })}</p>
      <div className={classes.beside}>
        <nav aria-label={t('categories.groups')}>
          <ul className={classes.list}>{groups.filter((g) => g.kind === 'Income').map(button)}</ul>
          {expenses.length > 0 && (
            <>
              <p className={classes.indexLabel}>
                <span>{t('categories.expenses')}</span>
                <span className={classes.num}>
                  {t('categories.groupCount', { count: expenses.length })}
                </span>
              </p>
              <ul className={classes.list}>{expenses.map(button)}</ul>
            </>
          )}
        </nav>
        <section
          // A new key per group, so its tags come in from the right when another one is picked
          key={group.id}
          className={cx(classes.detail, fresh === group.id && classes.detailIn)}
          data-kind={group.kind}
          aria-labelledby="category-group-title"
          aria-live="polite"
        >
          <p className={classes.kindLine}>
            {group.name === kindWord ? count : t('categories.kindLine', { kind: kindWord, count })}
          </p>
          <Title order={2} id="category-group-title" className={classes.detailTitle}>
            {group.name}
          </Title>
          <Tags group={group} />
        </section>
      </div>
    </>
  );
}
