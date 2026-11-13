import { ActionIcon, Button, Checkbox, Skeleton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconClock,
  IconClockX,
  IconLinkOff,
  IconTrash,
  IconUserCheck,
  IconX,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { daysUntil } from '../../shared/format/date';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import { cx } from '../../shared/ui/cx';
import { inListOrder, KEEP_DAYS, MAX_LINKS, shortDate, stoppedAt, type Place } from './linkGroups';
import { linksQueryOf, useCancelLink, useCancelLinks, useDeleteLinks } from './inviteLinksApi';
import classes from './InviteLinks.module.css';
import people from './People.module.css';
import type { Invitation } from './peopleApi';

const ICON = { size: 20, stroke: 1.7 } as const;

type Pending = { kind: 'cancel' | 'delete'; links: Invitation[] } | null;

function useNoteOf() {
  const { t } = useTranslation();
  return (link: Invitation) => link.note ?? t('inviteLinks.noNote');
}

/**
 * Invite links in one list (I-006, I-032): waiting ones first, then the rest, each part newest first, a status tag on
 * each row and one Select all over them. Every link has a check box (with a mouse it shows on hover or once anything is
 * picked), and the floating bar has Cancel links (when a waiting link is picked) and Delete, each asking once. The
 * admin's Invite links tab lists every link; the Family page its owner's family's.
 */
export function InviteLinks({ place }: { place: Place }) {
  const { t } = useTranslation();
  // Opening the list fetches the links again: one may have been used meanwhile
  const query = useQuery({ ...linksQueryOf(place), refetchOnMount: 'always' });
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [pending, setPending] = useState<Pending>(null);

  const all = query.data ?? [];
  // Picks of links that are gone (deleted, or changed by someone else meanwhile) drop out by themselves
  const pickedLinks = all.filter((link) => picked.has(link.id));
  const atMax = pickedLinks.length >= MAX_LINKS;

  const setPick = (id: string, on: boolean) => {
    const next = new Set(pickedLinks.map((link) => link.id));
    if (on) next.add(id);
    else next.delete(id);
    setPicked(next);
  };

  const done = () => {
    setPending(null);
    setPicked(new Set());
  };

  return (
    <div className={classes.links} data-place={place}>
      {query.isPending && (
        <div className={people.list} aria-busy="true">
          {[0, 1].map((i) => (
            <Skeleton key={i} height={72} radius="md" />
          ))}
        </div>
      )}

      {query.isError && (
        <div role="alert">
          <p className={people.nobodyText}>{t('inviteLinks.loadFailed')}</p>
          <Button
            variant="quiet"
            onClick={() => {
              void query.refetch();
            }}
          >
            {t('inviteLinks.retry')}
          </Button>
        </div>
      )}

      {/* With no links the admin's tab says how to make one; the Family page has only Create invite link above */}
      {query.isSuccess && all.length === 0 && place === 'admin' && (
        <p className={people.empty}>{t('inviteLinks.noneAdmin')}</p>
      )}

      {query.isSuccess && all.length > 0 && (
        <div data-picking={pickedLinks.length > 0 || undefined}>
          <ListHead
            count={all.length}
            picked={pickedLinks.length}
            onPickAll={(on) => {
              const ids = inListOrder(all).map((link) => link.id);
              setPicked(new Set(on ? ids.slice(0, MAX_LINKS) : []));
            }}
          />
          <ul className={classes.cards}>
            {inListOrder(all).map((link) => (
              <LinkRow
                key={link.id}
                link={link}
                place={place}
                picked={picked.has(link.id)}
                blocked={atMax && !picked.has(link.id)}
                onPick={(on) => {
                  setPick(link.id, on);
                }}
              />
            ))}
          </ul>
        </div>
      )}

      {query.isSuccess && all.some((link) => link.status !== 'Waiting') && (
        <p className={classes.legend}>{t('inviteLinks.legend', { days: KEEP_DAYS })}</p>
      )}

      {pickedLinks.length > 0 && (
        <PickedBar
          picked={pickedLinks}
          atMax={atMax}
          onCancel={() => {
            setPending({ kind: 'cancel', links: pickedLinks });
          }}
          onDelete={() => {
            setPending({ kind: 'delete', links: pickedLinks });
          }}
          onClear={() => {
            setPicked(new Set());
          }}
        />
      )}

      <ConfirmCancel
        place={place}
        picked={pending?.kind === 'cancel' ? pending.links : []}
        onClose={() => {
          setPending(null);
        }}
        onDone={done}
      />
      <ConfirmDelete
        place={place}
        links={pending?.kind === 'delete' ? pending.links : []}
        onClose={() => {
          setPending(null);
        }}
        onDone={done}
      />
    </div>
  );
}

interface ListHeadProps {
  count: number;
  picked: number;
  onPickAll: (on: boolean) => void;
}

/** The list's head (I-032): Select all, how many links there are and how many are picked. Nothing folds. */
function ListHead({ count, picked, onPickAll }: ListHeadProps) {
  const { t } = useTranslation();
  const all = picked > 0 && picked === Math.min(count, MAX_LINKS);

  return (
    <div className={classes.head}>
      <label className={cx(people.pick, classes.headPick)}>
        <Checkbox
          checked={all}
          indeterminate={picked > 0 && !all}
          aria-label={t('inviteLinks.pickAllLinks')}
          onChange={(event) => {
            onPickAll(event.currentTarget.checked);
          }}
        />
      </label>
      <span className={classes.titleLine}>
        <span className={people.count}>{t('inviteLinks.linkCount', { count })}</span>
        {picked > 0 && (
          <span className={classes.pickedHere}>
            {t('inviteLinks.pickedHere', { count: picked })}
          </span>
        )}
      </span>
    </div>
  );
}

interface LinkRowProps {
  link: Invitation;
  place: Place;
  picked: boolean;
  /** The most one action takes are picked: this one can't be added. */
  blocked: boolean;
  onPick: (on: boolean) => void;
}

function LinkRow({ link, place, picked, blocked, onPick }: LinkRowProps) {
  const { t } = useTranslation();
  const cancel = useCancelLink(place);
  const note = useNoteOf()(link);
  const stopped = stoppedAt(link);
  const date = stopped ? shortDate(stopped) : '';

  const icon =
    link.status === 'Waiting' ? (
      <IconClock {...ICON} />
    ) : link.status === 'Used' ? (
      <IconUserCheck {...ICON} />
    ) : link.status === 'Expired' ? (
      <IconClockX {...ICON} />
    ) : (
      <IconLinkOff {...ICON} />
    );

  // The tag says the status, so the details after it don't repeat it: "Used · by Olena on 3 Nov" (I-032)
  const usedBy = link.usedByName ?? t('inviteLinks.deletedAccount');

  const what =
    link.status === 'Waiting' ? (
      <>
        <span className={classes.left}>
          {t('inviteLinks.daysLeft', { count: daysUntil(link.expiresAt) })}
        </span>
        <span className={classes.until}>
          {t('inviteLinks.until', { date: shortDate(link.expiresAt) })}
        </span>
      </>
    ) : link.status === 'Used' ? (
      t('inviteLinks.afterTag.usedBy', { name: usedBy, date })
    ) : (
      t('inviteLinks.afterTag.on', { date })
    );

  return (
    <li className={classes.card} data-picked={picked || undefined}>
      <label className={people.pick}>
        <Checkbox
          className={classes.hoverBox}
          checked={picked}
          disabled={blocked}
          aria-label={t('inviteLinks.pick', { note })}
          onChange={(event) => {
            onPick(event.currentTarget.checked);
          }}
        />
      </label>
      <span
        className={people.historyIcon}
        data-done={link.status === 'Expired' || link.status === 'Cancelled' || undefined}
        aria-hidden="true"
      >
        {icon}
      </span>
      <p className={classes.note}>
        <span className={classes.noteText}>{note}</span>
        {place === 'admin' && link.familyName && (
          <span className={people.tag}>{t('inviteLinks.family', { name: link.familyName })}</span>
        )}
      </p>
      <p className={cx(classes.what, classes.whatWithStatus)}>
        {/* The status leads its line as a tag; the details follow it (I-032) */}
        <span className={classes.status} data-status={link.status}>
          {t(`inviteLinks.status.${link.status}`)}
        </span>
        <span>{what}</span>
      </p>
      {/* Old links show no date of their own: the line under the list says they go after 30 days (owner) */}
      {link.status === 'Waiting' && (
        <Button
          variant="quiet"
          className={classes.end}
          loading={cancel.isPending}
          aria-label={t('inviteLinks.cancelLabel', { note })}
          onClick={() => {
            cancel.mutate(link.id, {
              onSuccess: () => notifications.show({ message: t('inviteLinks.cancelled') }),
              onError: () =>
                notifications.show({ color: 'red', message: t('inviteLinks.cancelFailed') }),
            });
          }}
        >
          {t('inviteLinks.cancel')}
        </Button>
      )}
    </li>
  );
}

interface PickedBarProps {
  picked: Invitation[];
  atMax: boolean;
  onCancel: () => void;
  onDelete: () => void;
  onClear: () => void;
}

/** What to do with the picked links: Cancel links (when a waiting one is picked, as Block on People) and Delete. */
function PickedBar({ picked, atMax, onCancel, onDelete, onClear }: PickedBarProps) {
  const { t } = useTranslation();
  const anyWaiting = picked.some((link) => link.status === 'Waiting');

  return (
    <div className={people.bulk} role="region" aria-label={t('inviteLinks.bulk.label')}>
      <span className={people.bulkWhat}>
        {t('inviteLinks.bulk.picked', { count: picked.length })}
        {atMax && <span className={people.bulkMax}>{t('inviteLinks.bulk.max')}</span>}
      </span>
      {anyWaiting && (
        <Button
          variant="default"
          className={people.bulkButton}
          leftSection={<IconLinkOff {...ICON} />}
          onClick={onCancel}
        >
          {t('inviteLinks.bulk.cancel')}
          <span className={people.wideOnly}>&nbsp;{t('inviteLinks.bulk.cancelWide')}</span>
        </Button>
      )}
      <Button
        variant="default"
        className={people.bulkButton}
        leftSection={<IconTrash {...ICON} />}
        onClick={onDelete}
      >
        {t('inviteLinks.bulk.delete')}
      </Button>
      <ActionIcon
        variant="transparent"
        className={people.bulkClear}
        aria-label={t('inviteLinks.bulk.clear')}
        onClick={onClear}
      >
        <IconX {...ICON} />
      </ActionIcon>
    </div>
  );
}

function LinkNames({ items }: { items: Invitation[] }) {
  const { t } = useTranslation();
  const noteOf = useNoteOf();
  return (
    <ul className={people.names}>
      {items.map((link) => (
        <li key={link.id}>
          {noteOf(link)}
          <span className={classes.nameWhat}>
            {link.status === 'Waiting'
              ? t('inviteLinks.names.waiting')
              : link.status === 'Used'
                ? t('inviteLinks.names.used', {
                    name: link.usedByName ?? t('inviteLinks.deletedAccount'),
                  })
                : link.status === 'Expired'
                  ? t('inviteLinks.names.expired')
                  : t('inviteLinks.names.cancelled')}
          </span>
        </li>
      ))}
    </ul>
  );
}

interface ConfirmCancelProps {
  place: Place;
  /** Everything picked; only the waiting ones are cancelled. */
  picked: Invitation[];
  onClose: () => void;
  onDone: () => void;
}

/** Cancel links asks once, names the waiting links it cancels and says the others stay as they are. */
function ConfirmCancel({ place, picked, onClose, onDone }: ConfirmCancelProps) {
  const { t } = useTranslation();
  const noteOf = useNoteOf();
  const cancel = useCancelLinks(place);
  const waiting = picked.filter((link) => link.status === 'Waiting');
  const one = waiting.length === 1 ? waiting[0] : undefined;
  const others = picked.length - waiting.length;
  const count = waiting.length;

  return (
    <ResponsiveDialog
      opened={waiting.length > 0}
      onClose={onClose}
      title={
        one
          ? t('inviteLinks.confirmCancel.titleOne', { note: noteOf(one) })
          : t('inviteLinks.confirmCancel.titleMany', { count })
      }
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            {one ? t('inviteLinks.keepOne') : t('inviteLinks.keepMany')}
          </Button>
          <Button
            loading={cancel.isPending}
            leftSection={<IconLinkOff {...ICON} />}
            onClick={() => {
              cancel.mutate(
                waiting.map((link) => link.id),
                {
                  onSuccess: (cancelled) => {
                    notifications.show({
                      message:
                        cancelled === 1
                          ? t('inviteLinks.confirmCancel.doneOne')
                          : t('inviteLinks.confirmCancel.doneMany', { count: cancelled }),
                    });
                    onDone();
                  },
                  onError: () =>
                    notifications.show({
                      color: 'red',
                      message: t('inviteLinks.confirmCancel.failed'),
                    }),
                },
              );
            }}
          >
            {one
              ? t('inviteLinks.confirmCancel.buttonOne')
              : t('inviteLinks.confirmCancel.buttonMany', { count })}
          </Button>
        </>
      }
    >
      {!one && <LinkNames items={waiting} />}
      <p className={people.dialogText}>
        {/* No Expired and cancelled group to move to (I-032): the link just shows as cancelled in the list */}
        {one
          ? t('inviteLinks.confirmCancel.textOne', { days: KEEP_DAYS })
          : t('inviteLinks.confirmCancel.textMany', { days: KEEP_DAYS })}
      </p>
      {others > 0 && (
        <p className={cx(people.dialogText, people.dim)}>
          {t('inviteLinks.confirmCancel.others', { count: others })}
        </p>
      )}
    </ResponsiveDialog>
  );
}

interface ConfirmDeleteProps {
  place: Place;
  links: Invitation[];
  onClose: () => void;
  onDone: () => void;
}

/** Delete asks once, says how many go, and what happens to links that still work. */
function ConfirmDelete({ place, links, onClose, onDone }: ConfirmDeleteProps) {
  const { t } = useTranslation();
  const noteOf = useNoteOf();
  const remove = useDeleteLinks(place);
  const one = links.length === 1 ? links[0] : undefined;
  const count = links.length;
  const waiting = links.filter((link) => link.status === 'Waiting').length;
  const used = links.some((link) => link.status === 'Used');
  const family = place === 'family';

  const gone = used
    ? one
      ? t(family ? 'inviteLinks.confirmDelete.usedOneFamily' : 'inviteLinks.confirmDelete.usedOne')
      : t(
          family
            ? 'inviteLinks.confirmDelete.usedManyFamily'
            : 'inviteLinks.confirmDelete.usedMany',
        )
    : one
      ? t('inviteLinks.confirmDelete.goneOne')
      : t('inviteLinks.confirmDelete.goneMany');

  return (
    <ResponsiveDialog
      opened={links.length > 0}
      onClose={onClose}
      title={
        one
          ? t('inviteLinks.confirmDelete.titleOne', { note: noteOf(one) })
          : t('inviteLinks.confirmDelete.titleMany', { count })
      }
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            {one ? t('inviteLinks.keepOne') : t('inviteLinks.keepMany')}
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            leftSection={<IconTrash {...ICON} />}
            onClick={() => {
              remove.mutate(
                links.map((link) => link.id),
                {
                  onSuccess: (deleted) => {
                    notifications.show({
                      message:
                        deleted === 1
                          ? t('inviteLinks.confirmDelete.doneOne')
                          : t('inviteLinks.confirmDelete.doneMany', { count: deleted }),
                    });
                    onDone();
                  },
                  onError: () =>
                    notifications.show({
                      color: 'red',
                      message: t('inviteLinks.confirmDelete.failed'),
                    }),
                },
              );
            }}
          >
            {one
              ? t('inviteLinks.confirmDelete.buttonOne')
              : t('inviteLinks.confirmDelete.buttonMany', { count })}
          </Button>
        </>
      }
    >
      {!one && <LinkNames items={links} />}
      {waiting > 0 && (
        <p className={cx(people.dialogText, classes.warn)}>
          {one
            ? t('inviteLinks.confirmDelete.waitingOne')
            : t('inviteLinks.confirmDelete.waitingMany', { count: waiting })}
        </p>
      )}
      <p className={people.dialogText}>{gone}</p>
    </ResponsiveDialog>
  );
}
