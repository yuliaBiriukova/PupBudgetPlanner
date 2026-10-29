import {
  ActionIcon,
  Button,
  Checkbox,
  CloseButton,
  Menu,
  Skeleton,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBan, IconDots, IconLockOpen, IconSearch, IconTrash, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '../../shared/ui/cx';
import { formatDate } from '../../shared/format/date';
import classes from './People.module.css';
import { BlockDialog, DeleteDialog } from './PeopleDialogs';
import { matchesSearch, peopleQuery, usePeopleAction, type Person } from './peopleApi';

function initials(name: string) {
  return name
    .split(' ')
    .map((word) => word.slice(0, 1))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

type Pending = { kind: 'block' | 'delete'; ids: string[] } | null;

/** Everyone with an account: search, a check box per row for bulk actions and a ⋯ menu for one person. */
export function PeopleTab() {
  const { t } = useTranslation();
  const searchId = useId();
  // Opening the tab fetches the list again: someone may have signed up with a link meanwhile
  const people = useQuery({ ...peopleQuery, refetchOnMount: 'always' });
  const unblock = usePeopleAction();
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [pending, setPending] = useState<Pending>(null);

  const all = useMemo(() => people.data ?? [], [people.data]);
  const shown = all.filter((p) => matchesSearch(p, query));
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

  const count = query.trim()
    ? t('people.search.countOf', { count: shown.length, total: all.length })
    : t('people.search.count', { count: all.length });

  return (
    <>
      <p className={classes.lead}>{t('people.lead')}</p>
      <div className={classes.search}>
        <div className={classes.searchTop}>
          <label htmlFor={searchId} className={classes.searchLabel}>
            {t('people.search.label')}
          </label>
          {people.isSuccess && (
            <span className={classes.searchCount} aria-live="polite">
              {count}
            </span>
          )}
        </div>
        <TextInput
          id={searchId}
          type="search"
          autoComplete="off"
          placeholder={t('people.search.placeholder')}
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
          }}
          leftSection={<IconSearch size={20} stroke={1.7} />}
          rightSection={
            query ? (
              <CloseButton
                size="lg"
                radius="xl"
                aria-label={t('people.search.clear')}
                onClick={() => {
                  setQuery('');
                }}
              />
            ) : null
          }
          rightSectionWidth={52}
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
        <>
          <div className={classes.listHead}>
            <label className={classes.pick}>
              <Checkbox
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
            <span aria-hidden="true">{t('people.columns.person')}</span>
            <span aria-hidden="true">{t('people.columns.joined')}</span>
            <span aria-hidden="true">{t('people.columns.invitedWith')}</span>
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
        </>
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
      <label className={classes.pick}>
        {!person.isYou && (
          <Checkbox
            checked={picked}
            aria-label={t('people.pick', { name: person.displayName })}
            onChange={(event) => {
              onPick(event.currentTarget.checked);
            }}
          />
        )}
      </label>
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
