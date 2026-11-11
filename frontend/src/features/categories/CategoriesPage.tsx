import { ActionIcon, Button, Skeleton, Title, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconChevronDown,
  IconEye,
  IconEyeOff,
  IconPencil,
  IconPlus,
  IconRefresh,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '../../shared/ui/cx';
import classes from './Categories.module.css';
import {
  categoriesQuery,
  useRestoreGroup,
  type CategoryGroup,
  type CategoryKind,
} from './categoriesApi';
import { CategorySheet, type CategoryTarget } from './CategorySheet';
import { groupsOf, hiddenOf, shownOf } from './categoryRules';
import { GroupSheet, type GroupTarget } from './GroupSheet';
import { openGroups, readOpen, writeOpen } from './openGroups';

/** Mantine's `lg` breakpoint: from here the list of groups sits beside the picked group's categories. */
const WIDE_QUERY = '(min-width: 75em)';

/** "Rent, Bills, Home supplies and 6 more" for a folded group or a row in the list of groups. */
function usePreview() {
  const { t } = useTranslation();

  return (group: CategoryGroup) => {
    const names = shownOf(group).map((category) => category.name);
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

/** What the page opens: a category's sheet or a group's. */
export interface Editing {
  onCategory: (target: CategoryTarget) => void;
  onGroup: (target: GroupTarget) => void;
}

/**
 * A group's categories as tags you tap (F-029): each opens its sheet, a dashed + Add ends them, then the hidden ones,
 * dashed and quiet.
 */
function Tags({
  group,
  id,
  animate,
  editing,
}: {
  group: CategoryGroup;
  id?: string;
  animate?: boolean;
  editing: Editing;
}) {
  const { t } = useTranslation();
  return (
    <ul className={cx(classes.tags, animate && classes.tagsIn)} id={id}>
      {shownOf(group).map((category) => (
        <li key={category.id}>
          <UnstyledButton
            className={classes.tag}
            onClick={() => {
              editing.onCategory({ categoryId: category.id });
            }}
          >
            {category.name}
          </UnstyledButton>
        </li>
      ))}
      <li>
        <UnstyledButton
          className={cx(classes.tag, classes.addTag)}
          aria-label={t('categories.edit.addTo', { group: group.name })}
          onClick={() => {
            editing.onCategory({ newIn: group.id });
          }}
        >
          <IconPlus size={16} stroke={1.7} aria-hidden />
          {t('categories.edit.add')}
        </UnstyledButton>
      </li>
      {hiddenOf(group).map((category) => (
        <li key={category.id}>
          <UnstyledButton
            className={cx(classes.tag, classes.hiddenTag)}
            aria-label={t('categories.edit.hiddenTag', { name: category.name })}
            onClick={() => {
              editing.onCategory({ categoryId: category.id });
            }}
          >
            <IconEyeOff size={16} stroke={1.7} aria-hidden />
            {category.name}
          </UnstyledButton>
        </li>
      ))}
    </ul>
  );
}

/** After a kind's groups: its hidden groups with Show, then + Add income group / + Add expense group. */
function KindFooter({
  kind,
  groups,
  editing,
}: {
  kind: CategoryKind;
  groups: CategoryGroup[];
  editing: Editing;
}) {
  const { t } = useTranslation();
  const restore = useRestoreGroup();
  const hidden = groups.filter((g) => g.kind === kind && g.isHidden);
  return (
    <>
      {hidden.length > 0 && (
        <ul className={classes.list}>
          {hidden.map((g) => (
            <li key={g.id} className={classes.hiddenRow}>
              <IconEyeOff size={20} stroke={1.7} aria-hidden />
              <span className={classes.hiddenName}>{g.name}</span>
              <span className={classes.hiddenLabel}>{t('categories.edit.hiddenGroup')}</span>
              <Button
                variant="quiet"
                leftSection={<IconEye size={20} stroke={1.7} />}
                aria-label={t('categories.edit.showAgainOf', { name: g.name })}
                loading={restore.isPending && restore.variables === g.id}
                onClick={() => {
                  restore.mutate(g.id, {
                    onSuccess: () => {
                      notifications.show({
                        message: t('categories.done.groupBack', { name: g.name }),
                      });
                    },
                    onError: () => {
                      notifications.show({ color: 'red', message: t('categories.errors.save') });
                    },
                  });
                }}
              >
                {t('categories.edit.show')}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <UnstyledButton
        className={classes.addGroup}
        onClick={() => {
          editing.onGroup({ newKind: kind });
        }}
      >
        <IconPlus size={20} stroke={1.7} aria-hidden />
        {t(`categories.edit.addGroup.${kind}`)}
      </UnstyledButton>
    </>
  );
}

/**
 * Categories (F-015, final prototype variant 7; F-029, final prototype "Tap a tag"). On the phone and tablet every
 * group with its categories as tags, folded except the open ones (any number); on the desktop the list of groups and
 * one group's tags beside it. Both layouts share the open groups, remembered on the device (owner's review,
 * 2026-10-31). No edit mode: every tag opens its own sheet, a dashed + Add ends a group's tags, a group's pencil (Edit
 * group on the desktop) opens the group's sheet; hidden ones show quiet, with Show again.
 */
export function CategoriesPage() {
  const { t } = useTranslation();
  const categories = useQuery(categoriesQuery);
  const isWide = useMediaQuery(WIDE_QUERY, false, { getInitialValueInEffect: false });
  const [stored, setStored] = useState(readOpen);
  // The group just opened: its tags come out of its row, or in from the right on the desktop
  const [fresh, setFresh] = useState<string>();
  const [category, setCategory] = useState<CategoryTarget>();
  const [group, setGroup] = useState<GroupTarget>();
  // A new key each time, so a sheet opens with its own fresh state
  const [sheetKey, setSheetKey] = useState(0);

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
          {[3, 6, 4].map((tags, index) => (
            <div key={index} className={classes.group}>
              <Skeleton height={16} width={[90, 140, 100][index]} radius="sm" my={16} />
              <div className={classes.tags}>
                {Array.from({ length: tags }, (_, tag) => (
                  <Skeleton
                    key={tag}
                    height={44}
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

  const all = categories.data.groups;
  const groups = all.filter((g) => !g.isHidden);
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

  const total = groups.reduce((sum, g) => sum + shownOf(g).length, 0);
  const summary = t('categories.summary', {
    categories: t('categories.count', { count: total }),
    groups: t('categories.groupCount', { count: groups.length }),
  });

  const open = openGroups(
    stored,
    groups.map((g) => g.id),
  );
  const setOpen = (next: string[], opened?: string) => {
    setStored(next);
    writeOpen(next);
    setFresh(opened);
  };
  const editing: Editing = {
    onCategory: (target) => {
      setSheetKey(sheetKey + 1);
      setCategory(target);
    },
    onGroup: (target) => {
      setSheetKey(sheetKey + 1);
      setGroup(target);
    },
  };
  const footer = (kind: CategoryKind) => <KindFooter kind={kind} groups={all} editing={editing} />;
  const props = { groups, summary, open, setOpen, fresh, editing, footer };

  return (
    <>
      {head}
      {isWide ? <GroupsBeside {...props} /> : <FoldingGroups {...props} />}
      {category && (
        <CategorySheet
          key={sheetKey}
          target={category}
          groups={all}
          onClose={() => {
            setCategory(undefined);
          }}
        />
      )}
      {group && (
        <GroupSheet
          key={sheetKey}
          target={group}
          groups={all}
          onClose={() => {
            setGroup(undefined);
          }}
        />
      )}
    </>
  );
}

interface GroupsProps {
  /** The shown groups. */
  groups: CategoryGroup[];
  summary: string;
  /** The open groups, the most recently opened last. */
  open: string[];
  setOpen: (open: string[], opened?: string) => void;
  /** The group just opened by a tap or click. */
  fresh?: string;
  editing: Editing;
  /** After a kind's groups: its hidden groups and + Add group. */
  footer: (kind: CategoryKind) => ReactNode;
}

/**
 * Phone and tablet: every group, folded except the open ones; any number can be open. Income first, then the
 * expenses under their label. A group's pencil after its row opens its sheet.
 */
function FoldingGroups({ groups, summary, open, setOpen, fresh, editing, footer }: GroupsProps) {
  const { t } = useTranslation();
  const preview = usePreview();

  const allFolded = open.length === 0;
  const income = groupsOf(groups, 'Income');
  const expenses = groupsOf(groups, 'Expense');
  const expenseCount = expenses.reduce((sum, group) => sum + shownOf(group).length, 0);

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
        <div className={classes.headingRow}>
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
              <span className={cx(classes.count, classes.num)}>{shownOf(group).length}</span>
              <IconChevronDown className={classes.chevron} size={20} stroke={1.7} aria-hidden />
            </UnstyledButton>
          </h2>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={t('categories.edit.groupOf', { name: group.name })}
            onClick={() => {
              editing.onGroup({ groupId: group.id });
            }}
          >
            <IconPencil size={20} stroke={1.7} />
          </ActionIcon>
        </div>
        {isOpen && (
          <Tags group={group} id={tagsId} animate={fresh === group.id} editing={editing} />
        )}
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
      {income.map(renderGroup)}
      {footer('Income')}
      <p className={classes.kindLabel}>
        <span>{t('categories.expenses')}</span>
        <span className={classes.num}>{t('categories.count', { count: expenseCount })}</span>
      </p>
      {expenses.map(renderGroup)}
      {footer('Expense')}
    </>
  );
}

/**
 * Desktop: the list of groups on the left, one group's categories as bigger tags on the right: the last one opened,
 * or the first group. Picking one makes it the only open group, so the phone shows just that one open. Edit group
 * beside its title opens its sheet.
 */
function GroupsBeside({ groups, summary, open, setOpen, fresh, editing, footer }: GroupsProps) {
  const { t } = useTranslation();
  const preview = usePreview();
  const group = groups.find((g) => g.id === open.at(-1)) ?? groups[0];
  if (!group) return null;
  const kindWord = t(`categories.kind.${group.kind}`);
  const count = t('categories.count', { count: shownOf(group).length });

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
  const expenses = groupsOf(groups, 'Expense');

  return (
    <>
      <p className={classes.intro}>{t('categories.intro', { summary })}</p>
      <div className={classes.beside}>
        <nav aria-label={t('categories.groups')}>
          <ul className={classes.list}>{groupsOf(groups, 'Income').map(button)}</ul>
          {footer('Income')}
          <p className={classes.indexLabel}>
            <span>{t('categories.expenses')}</span>
            <span className={classes.num}>
              {t('categories.groupCount', { count: expenses.length })}
            </span>
          </p>
          <ul className={classes.list}>{expenses.map(button)}</ul>
          {footer('Expense')}
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
          <div className={classes.detailHead}>
            <Title order={2} id="category-group-title" className={classes.detailTitle}>
              {group.name}
            </Title>
            <Button
              variant="quiet"
              leftSection={<IconPencil size={20} stroke={1.7} />}
              onClick={() => {
                editing.onGroup({ groupId: group.id });
              }}
            >
              {t('categories.edit.group')}
            </Button>
          </div>
          <Tags group={group} editing={editing} />
        </section>
      </div>
    </>
  );
}
