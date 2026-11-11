import { Title, UnstyledButton } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { CategoryKind } from '../../features/categories/categoriesApi';
import classes from '../../features/categories/Categories.module.css';
import { cx } from '../../shared/ui/cx';
import type { ProtoGroup } from './protoData';
import proto from './Proto.module.css';
import { useSummary } from './summary';
import { groupsOf, shownOf } from './useCategoryEdits';

/** Mantine's `lg` breakpoint, as on the Categories page: from here the groups' list sits beside one group. */
export const WIDE_QUERY = '(min-width: 75em)';

function usePreview() {
  const { t } = useTranslation();
  return (group: ProtoGroup) => {
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

/** The page's tags, as F-015 shows them. */
export function Tags({ group, animate }: { group: ProtoGroup; animate?: boolean }) {
  return (
    <ul className={cx(classes.tags, animate && classes.tagsIn)}>
      {shownOf(group).map((category) => (
        <li key={category.id}>{category.name}</li>
      ))}
    </ul>
  );
}

export interface ReadViewProps {
  groups: ProtoGroup[];
  wide: boolean;
  /** A group's categories; the page's tags unless a variant shows its own. */
  tags?: (group: ProtoGroup, animate: boolean) => ReactNode;
  /** After a group's row on the phone and tablet. */
  rowAction?: (group: ProtoGroup) => ReactNode;
  /** Beside the picked group's title on the desktop. */
  detailAction?: (group: ProtoGroup) => ReactNode;
  /** After a kind's groups. */
  kindFooter?: (kind: CategoryKind) => ReactNode;
  /** Above the groups, after the count. */
  barAction?: ReactNode;
}

/**
 * A copy of the Categories page's two layouts (F-015) on the prototype's data, with places for what a variant adds.
 * The open groups are kept in the story only.
 */
export function ReadView(props: ReadViewProps) {
  const [open, setOpen] = useState<string[]>(() => props.groups.slice(0, 1).map((g) => g.id));
  const [fresh, setFresh] = useState<string>();
  const set = (next: string[], opened?: string) => {
    setOpen(next);
    setFresh(opened);
  };
  return props.wide ? (
    <Beside {...props} open={open} setOpen={set} fresh={fresh} />
  ) : (
    <Folding {...props} open={open} setOpen={set} fresh={fresh} />
  );
}

interface LayoutProps extends ReadViewProps {
  open: string[];
  setOpen: (open: string[], opened?: string) => void;
  fresh?: string;
}

function Folding({
  groups,
  open,
  setOpen,
  fresh,
  tags,
  rowAction,
  kindFooter,
  barAction,
}: LayoutProps) {
  const { t } = useTranslation();
  const preview = usePreview();
  const summary = useSummary(groups);
  const income = groupsOf(groups, 'Income');
  const expenses = groupsOf(groups, 'Expense');
  const expenseCount = expenses.reduce((sum, group) => sum + shownOf(group).length, 0);
  const allFolded = open.length === 0;

  const renderGroup = (group: ProtoGroup) => {
    const isOpen = open.includes(group.id);
    const heading = (
      <h2 className={classes.groupHeading}>
        <UnstyledButton
          className={classes.groupButton}
          aria-expanded={isOpen}
          onClick={() => {
            if (isOpen) setOpen(open.filter((id) => id !== group.id));
            else setOpen([...open, group.id], group.id);
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
    );
    return (
      <section
        key={group.id}
        className={classes.group}
        data-kind={group.kind}
        data-folded={isOpen ? undefined : true}
      >
        {rowAction ? (
          <div className={proto.headingRow}>
            {heading}
            {rowAction(group)}
          </div>
        ) : (
          heading
        )}
        {isOpen &&
          (tags ? (
            tags(group, fresh === group.id)
          ) : (
            <Tags group={group} animate={fresh === group.id} />
          ))}
      </section>
    );
  };

  return (
    <>
      <div className={classes.bar}>
        <span>{summary}</span>
        <span className={proto.barActions}>
          {barAction}
          <UnstyledButton
            className={classes.textLink}
            onClick={() => {
              setOpen(
                allFolded
                  ? groupsOf(groups, 'Income')
                      .concat(expenses)
                      .map((g) => g.id)
                      .reverse()
                  : [],
              );
            }}
          >
            {allFolded ? t('categories.expandAll') : t('categories.collapseAll')}
          </UnstyledButton>
        </span>
      </div>
      {income.map(renderGroup)}
      {kindFooter?.('Income')}
      <p className={classes.kindLabel}>
        <span>{t('categories.expenses')}</span>
        <span className={classes.num}>{t('categories.count', { count: expenseCount })}</span>
      </p>
      {expenses.map(renderGroup)}
      {kindFooter?.('Expense')}
    </>
  );
}

function Beside({
  groups,
  open,
  setOpen,
  fresh,
  tags,
  detailAction,
  kindFooter,
  barAction,
}: LayoutProps) {
  const { t } = useTranslation();
  const preview = usePreview();
  const summary = useSummary(groups);
  const shown = groups.filter((g) => !g.hidden);
  const group = shown.find((g) => g.id === open.at(-1)) ?? shown[0];
  if (!group) return null;
  const kind = t(`categories.kind.${group.kind}`);
  const count = t('categories.count', { count: shownOf(group).length });
  const expenses = groupsOf(groups, 'Expense');

  const button = (g: ProtoGroup) => (
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

  return (
    <>
      <div className={proto.introRow}>
        <p className={classes.intro}>{t('categories.intro', { summary })}</p>
        {barAction}
      </div>
      <div className={classes.beside}>
        <nav aria-label={t('categories.groups')}>
          <ul className={classes.list}>{groupsOf(groups, 'Income').map(button)}</ul>
          {kindFooter?.('Income')}
          <p className={classes.indexLabel}>
            <span>{t('categories.expenses')}</span>
            <span className={classes.num}>
              {t('categories.groupCount', { count: expenses.length })}
            </span>
          </p>
          <ul className={classes.list}>{expenses.map(button)}</ul>
          {kindFooter?.('Expense')}
        </nav>
        <section
          key={group.id}
          className={cx(classes.detail, fresh === group.id && classes.detailIn)}
          data-kind={group.kind}
          aria-labelledby="category-group-title"
        >
          <p className={classes.kindLine}>
            {group.name === kind ? count : t('categories.kindLine', { kind, count })}
          </p>
          <div className={proto.detailHead}>
            <Title order={2} id="category-group-title" className={classes.detailTitle}>
              {group.name}
            </Title>
            {detailAction?.(group)}
          </div>
          {tags ? tags(group, false) : <Tags group={group} />}
        </section>
      </div>
    </>
  );
}
