import {
  ActionIcon,
  Button,
  Checkbox,
  CloseButton,
  Menu,
  Skeleton,
  TextInput,
  VisuallyHidden,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowDown,
  IconArrowsSort,
  IconArrowUp,
  IconBan,
  IconCheck,
  IconDots,
  IconLockOpen,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '../../shared/ui/cx';
import { formatDate } from '../../shared/format/date';
import classes from './People.module.css';
import { BlockDialog, DeleteDialog } from './PeopleDialogs';
import {
  FIRST_DIRECTION,
  matchesSearch,
  peopleQuery,
  sortPeople,
  usePeopleAction,
  type PeopleSort,
  type Person,
  type SortKey,
} from './peopleApi';

function initials(name: string) {
  return name
    .split(' ')
    .map((word) => word.slice(0, 1))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

type Pending = { kind: 'block' | 'delete'; ids: string[] } | null;

const SORT_KEYS: SortKey[] = ['person', 'joined', 'invited'];
const COLUMN_LABEL = { person: 'person', joined: 'joined', invited: 'invitedWith' } as const;
const orderKey = (sort: PeopleSort) => `${sort.key}${sort.desc ? 'Desc' : 'Asc'}` as const;

/**
 * Everyone with an account: search, sorting by a column, a check box per row for bulk actions (on the left,
 * shown on hover or once anyone is picked) and a ⋯ menu for one person.
 */
export function PeopleTab() {
  const { t } = useTranslation();
  // Opening the tab fetches the list again: someone may have signed up with a link meanwhile
  const people = useQuery({ ...peopleQuery, refetchOnMount: 'always' });
  const unblock = usePeopleAction();
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [pending, setPending] = useState<Pending>(null);
  const [sort, setSort] = useState<PeopleSort>({ key: 'person', desc: false });

  const all = useMemo(() => people.data ?? [], [people.data]);
  const shown = sortPeople(
    all.filter((p) => matchesSearch(p, query)),
    sort,
  );
  const pickable = shown.filter((p) => !p.isYou);
  // Searching keeps only the picks that are still shown
  const shownPicks = new Set([...picked].filter((id) => pickable.some((p) => p.id === id)));
  const pickedPeople = all.filter((p) => shownPicks.has(p.id));
  const allPicked = pickable.length > 0 && pickable.every((p) => shownPicks.has(p.id));

  const setPick = (id: string, on: boolean) => {
    const next = new Set(shownPicks);
    if (on) next.add(id);
    else next.delete(id);
    setPicked(next);
  };

  // A new column starts in its usual direction; the same column again turns it around
  const sortBy = (key: SortKey) => {
    setSort((now) =>
      now.key === key ? { key, desc: !now.desc } : { key, desc: FIRST_DIRECTION[key] },
    );
  };

  const doUnblock = (targets: Person[]) => {
    unblock.mutate(
      { action: 'unblock', userIds: targets.map((p) => p.id) },
      {
        onSuccess: () => {
          notifications.show({
            message:
              targets.length === 1 && targets[0]
                ? t('people.unblock.doneOne', { name: targets[0].displayName.split(' ')[0] })
                : t('people.unblock.doneMany', { count: targets.length }),
          });
          setPicked(new Set());
        },
        onError: () => notifications.show({ color: 'red', message: t('people.errors.action') }),
      },
    );
  };

  // The tab shows how many people there are; while searching, the field says how many match
  const searching = people.isSuccess && query.trim() !== '';

  return (
    <>
      <p className={classes.lead}>{t('people.lead')}</p>
      <div className={classes.search}>
        <TextInput
          aria-label={t('people.search.label')}
          type="search"
          autoComplete="off"
          placeholder={t('people.search.placeholder')}
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
          }}
          leftSection={<IconSearch size={20} stroke={1.7} />}
          rightSection={
            <div className={classes.searchRight}>
              {/* Always there, so screen readers hear the count change as the person types */}
              <span className={classes.searchCount} aria-live="polite">
                {searching
                  ? t('people.search.countOf', { count: shown.length, total: all.length })
                  : ''}
              </span>
              {query && (
                <CloseButton
                  size="lg"
                  radius="xl"
                  aria-label={t('people.search.clear')}
                  onClick={() => {
                    setQuery('');
                  }}
                />
              )}
            </div>
          }
          rightSectionWidth={searching ? 136 : query ? 52 : 0}
          classNames={{ input: classes.searchInput }}
        />
      </div>

      {people.isPending && (
        <div className={classes.list} aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={68} radius="md" />
          ))}
        </div>
      )}

      {people.isError && (
        <div role="alert">
          <p className={classes.nobodyText}>{t('people.errors.load')}</p>
          <Button
            radius="xl"
            variant="default"
            onClick={() => {
              void people.refetch();
            }}
          >
            {t('people.retry')}
          </Button>
        </div>
      )}

      {people.isSuccess && shown.length === 0 && (
        <div className={classes.nobody} role="status">
          <h2 className={classes.nobodyTitle}>
            {t('people.search.noneTitle', { query: query.trim() })}
          </h2>
          <p className={classes.nobodyText}>{t('people.search.noneText')}</p>
          <Button
            radius="xl"
            variant="default"
            onClick={() => {
              setQuery('');
            }}
          >
            {t('people.search.clear')}
          </Button>
        </div>
      )}

      {people.isSuccess && shown.length > 0 && (
        <div className={classes.table} data-picking={shownPicks.size > 0 || undefined}>
          <SortMenu sort={sort} onSort={setSort} />
          <div className={classes.listHead}>
            <label className={classes.pick}>
              <Checkbox
                className={classes.pickBox}
                checked={allPicked}
                indeterminate={!allPicked && shownPicks.size > 0}
                disabled={pickable.length === 0}
                aria-label={t('people.pickAll')}
                onChange={(event) => {
                  setPicked(
                    event.currentTarget.checked ? new Set(pickable.map((p) => p.id)) : new Set(),
                  );
                }}
              />
            </label>
            {SORT_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                className={classes.sortButton}
                data-active={sort.key === key || undefined}
                onClick={() => {
                  sortBy(key);
                }}
              >
                {t(`people.columns.${COLUMN_LABEL[key]}`)}
                {sort.key === key && (
                  <>
                    {sort.desc ? (
                      <IconArrowDown size={16} stroke={1.7} aria-hidden="true" />
                    ) : (
                      <IconArrowUp size={16} stroke={1.7} aria-hidden="true" />
                    )}
                    <VisuallyHidden>
                      {t('people.sort.state', { order: t(`people.sort.${orderKey(sort)}`) })}
                    </VisuallyHidden>
                  </>
                )}
              </button>
            ))}
            <span />
          </div>
          <ul className={classes.list}>
            {shown.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                picked={shownPicks.has(person.id)}
                onPick={(on) => {
                  setPick(person.id, on);
                }}
                onBlock={() => {
                  setPending({ kind: 'block', ids: [person.id] });
                }}
                onUnblock={() => {
                  doUnblock([person]);
                }}
                onDelete={() => {
                  setPending({ kind: 'delete', ids: [person.id] });
                }}
              />
            ))}
          </ul>
          <p className={classes.legend}>{t('people.beforeInvitesLegend')}</p>
        </div>
      )}

      {pickedPeople.length > 0 && (
        <BulkBar
          picked={pickedPeople}
          onBlock={() => {
            setPending({
              kind: 'block',
              ids: pickedPeople.filter((p) => !p.blockedAt).map((p) => p.id),
            });
          }}
          onUnblock={() => {
            doUnblock(pickedPeople);
          }}
          onDelete={() => {
            setPending({ kind: 'delete', ids: pickedPeople.map((p) => p.id) });
          }}
          onClear={() => {
            setPicked(new Set());
          }}
        />
      )}

      <BlockDialog
        people={pending?.kind === 'block' ? all.filter((p) => pending.ids.includes(p.id)) : []}
        onClose={() => {
          setPending(null);
        }}
        onDone={() => {
          setPending(null);
          setPicked(new Set());
        }}
      />
      <DeleteDialog
        people={pending?.kind === 'delete' ? all.filter((p) => pending.ids.includes(p.id)) : []}
        onClose={() => {
          setPending(null);
        }}
        onDone={() => {
          setPending(null);
          setPicked(new Set());
        }}
      />
    </>
  );
}

interface PersonRowProps {
  person: Person;
  picked: boolean;
  onPick: (on: boolean) => void;
  onBlock: () => void;
  onUnblock: () => void;
  onDelete: () => void;
}

function PersonRow({ person, picked, onPick, onBlock, onUnblock, onDelete }: PersonRowProps) {
  const { t } = useTranslation();
  const invitedWith = person.isAdmin
    ? t('people.admin')
    : person.invited
      ? person.invitationNote
        ? `“${person.invitationNote}”`
        : t('people.links.noNote')
      : t('people.beforeInvites');
  const joined = person.blockedAt
    ? t('people.blockedOn', { date: formatDate(person.blockedAt) })
    : formatDate(person.joinedAt);

  return (
    <li
      className={classes.row}
      data-blocked={person.blockedAt ? true : undefined}
      data-picked={picked || undefined}
    >
      {person.isYou ? (
        <span className={classes.pick} />
      ) : (
        <label className={classes.pick}>
          <Checkbox
            className={classes.pickBox}
            checked={picked}
            aria-label={t('people.pick', { name: person.displayName })}
            onChange={(event) => {
              onPick(event.currentTarget.checked);
            }}
          />
        </label>
      )}
      <div className={classes.who}>
        <span className={classes.initials} aria-hidden="true">
          {initials(person.displayName)}
        </span>
        <div>
          <p className={classes.name}>
            <span>{person.displayName}</span>
            {person.isYou && <span className={classes.tag}>{t('people.youAdmin')}</span>}
            {person.blockedAt && (
              <span className={cx(classes.tag, classes.tagBlocked)}>
                <IconBan size={16} stroke={1.7} aria-hidden="true" />
                {t('people.blocked')}
              </span>
            )}
          </p>
          <p className={classes.email}>{person.email}</p>
        </div>
      </div>
      <p className={classes.meta}>
        {person.blockedAt
          ? t('people.metaBlocked', { date: formatDate(person.blockedAt), invitedWith })
          : t('people.meta', { date: formatDate(person.joinedAt), invitedWith })}
      </p>
      <p className={cx(classes.cell, person.blockedAt && classes.blockedText)}>{joined}</p>
      <p className={cx(classes.cell, !person.invited && classes.dim)} title={invitedWith}>
        {invitedWith}
      </p>
      <div className={classes.acts}>
        {!person.isYou && (
          <Menu position="bottom-end" radius="md" shadow="md" width={230}>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size={44}
                radius="xl"
                aria-label={t('people.actionsFor', { name: person.displayName })}
              >
                <IconDots size={20} stroke={1.7} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {person.blockedAt ? (
                <Menu.Item
                  leftSection={<IconLockOpen size={20} stroke={1.7} />}
                  onClick={onUnblock}
                  mih={44}
                >
                  {t('people.unblock.action')}
                </Menu.Item>
              ) : (
                <Menu.Item
                  leftSection={<IconBan size={20} stroke={1.7} />}
                  onClick={onBlock}
                  mih={44}
                >
                  {t('people.block.action')}
                </Menu.Item>
              )}
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={20} stroke={1.7} />}
                onClick={onDelete}
                mih={44}
              >
                {t('people.delete.action')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </div>
    </li>
  );
}

interface SortMenuProps {
  sort: PeopleSort;
  onSort: (sort: PeopleSort) => void;
}

/** The phone has no column headers: the order is picked from a menu. */
function SortMenu({ sort, onSort }: SortMenuProps) {
  const { t } = useTranslation();
  const orders = SORT_KEYS.flatMap((key) => [
    { key, desc: FIRST_DIRECTION[key] },
    { key, desc: !FIRST_DIRECTION[key] },
  ]);

  return (
    <div className={classes.sortRow}>
      <Menu position="bottom-end" radius="md" shadow="md" width={240}>
        <Menu.Target>
          <Button
            variant="subtle"
            color="gray"
            radius="xl"
            className={classes.sortMenuButton}
            leftSection={<IconArrowsSort size={20} stroke={1.7} />}
          >
            {t('people.sort.button', { order: t(`people.sort.${orderKey(sort)}`) })}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {orders.map((order) => {
            const current = order.key === sort.key && order.desc === sort.desc;
            return (
              <Menu.Item
                key={orderKey(order)}
                mih={44}
                aria-current={current || undefined}
                rightSection={current ? <IconCheck size={20} stroke={1.7} /> : null}
                onClick={() => {
                  onSort(order);
                }}
              >
                {t(`people.sort.${orderKey(order)}`)}
              </Menu.Item>
            );
          })}
        </Menu.Dropdown>
      </Menu>
    </div>
  );
}

interface BulkBarProps {
  picked: Person[];
  onBlock: () => void;
  onUnblock: () => void;
  onDelete: () => void;
  onClear: () => void;
}

/** What to do with everyone picked: Block (if any can be), Unblock (if only blocked are picked), Delete. */
function BulkBar({ picked, onBlock, onUnblock, onDelete, onClear }: BulkBarProps) {
  const { t } = useTranslation();
  const anyActive = picked.some((p) => !p.blockedAt);

  return (
    <div className={classes.bulk} role="region" aria-label={t('people.bulk.label')}>
      <span className={classes.bulkWhat}>{t('people.bulk.picked', { count: picked.length })}</span>
      {anyActive ? (
        <Button
          radius="xl"
          variant="default"
          className={classes.bulkButton}
          leftSection={<IconBan size={20} stroke={1.7} />}
          onClick={onBlock}
        >
          {t('people.bulk.block')}
        </Button>
      ) : (
        <Button
          radius="xl"
          variant="default"
          className={classes.bulkButton}
          leftSection={<IconLockOpen size={20} stroke={1.7} />}
          onClick={onUnblock}
        >
          {t('people.bulk.unblock')}
        </Button>
      )}
      <Button
        radius="xl"
        variant="default"
        className={classes.bulkButton}
        leftSection={<IconTrash size={20} stroke={1.7} />}
        onClick={onDelete}
      >
        {t('people.bulk.delete')}
      </Button>
      <ActionIcon
        variant="transparent"
        size={44}
        radius="xl"
        className={classes.bulkClear}
        aria-label={t('people.bulk.clear')}
        onClick={onClear}
      >
        <IconX size={20} stroke={1.7} />
      </ActionIcon>
    </div>
  );
}
