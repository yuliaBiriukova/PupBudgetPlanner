import { Button, Skeleton, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconChevronDown,
  IconClock,
  IconClockX,
  IconLinkOff,
  IconUserCheck,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { daysUntil, formatDate } from '../../shared/format/date';
import { cx } from '../../shared/ui/cx';
import classes from './People.module.css';
import { invitationsQuery, useCancelInvitation, type Invitation } from './peopleApi';

/** Which folded groups the admin left open; kept in this browser only. */
const SHOWN_KEY = 'pup.people.links.shown';

type Group = 'used' | 'old';

function readShown(): Group[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SHOWN_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((g): g is Group => g === 'used' || g === 'old') : [];
  } catch {
    return [];
  }
}

function writeShown(groups: Group[]) {
  try {
    localStorage.setItem(SHOWN_KEY, JSON.stringify(groups));
  } catch {
    // Private windows may refuse storage; the groups just start folded next time
  }
}

/** Waiting links first; used, expired and cancelled ones folded until the admin opens them. */
export function LinksTab() {
  const { t } = useTranslation();
  // Opening the tab fetches the links again: one may have been used meanwhile
  const invitations = useQuery({ ...invitationsQuery, refetchOnMount: 'always' });
  const [shown, setShown] = useState<Group[]>(readShown);

  const toggle = (group: Group) => {
    const next = shown.includes(group) ? shown.filter((g) => g !== group) : [...shown, group];
    setShown(next);
    writeShown(next);
  };

  const all = invitations.data ?? [];
  const waiting = all.filter((i) => i.status === 'Waiting');
  const used = all.filter((i) => i.status === 'Used');
  const old = all.filter((i) => i.status === 'Expired' || i.status === 'Cancelled');

  return (
    <>
      <p className={classes.lead}>{t('people.links.lead')}</p>

      {invitations.isPending && (
        <div className={classes.list} aria-busy="true">
          {[0, 1].map((i) => (
            <Skeleton key={i} height={72} radius="md" />
          ))}
        </div>
      )}

      {invitations.isError && (
        <div role="alert">
          <p className={classes.nobodyText}>{t('people.errors.loadLinks')}</p>
          <Button
            radius="xl"
            variant="default"
            onClick={() => {
              void invitations.refetch();
            }}
          >
            {t('people.retry')}
          </Button>
        </div>
      )}

      {invitations.isSuccess && (
        <>
          <section className={classes.group} aria-labelledby="links-waiting">
            <div className={classes.groupHead}>
              <h2 id="links-waiting" className={classes.groupTitle}>
                {t('people.links.waiting')}
              </h2>
              <span className={classes.count}>{waiting.length}</span>
            </div>
            {waiting.length === 0 ? (
              <p className={classes.nobodyText}>{t('people.links.noneWaiting')}</p>
            ) : (
              waiting.map((invitation) => (
                <WaitingLink key={invitation.id} invitation={invitation} />
              ))
            )}
          </section>
          <Folded
            group="used"
            title={t('people.links.used')}
            count={used.length}
            open={shown.includes('used')}
            onToggle={toggle}
          >
            <ul className={classes.history}>
              {used.map((i) => (
                <li key={i.id} className={classes.historyRow}>
                  <span className={classes.historyIcon} aria-hidden="true">
                    <IconUserCheck size={20} stroke={1.7} />
                  </span>
                  <p className={classes.historyNote}>{i.note ?? t('people.links.noNote')}</p>
                  <p className={cx(classes.historyWhat, classes.dim)}>
                    {i.usedByName ?? t('people.links.deletedAccount')}
                  </p>
                  <p className={classes.when}>{i.usedAt ? formatDate(i.usedAt) : ''}</p>
                </li>
              ))}
            </ul>
          </Folded>
          <Folded
            group="old"
            title={t('people.links.old')}
            count={old.length}
            open={shown.includes('old')}
            onToggle={toggle}
          >
            <ul className={classes.history}>
              {old.map((i) => (
                <li key={i.id} className={classes.historyRow}>
                  {/* Links that can't be used any more: a grey circle */}
                  <span className={classes.historyIcon} data-done aria-hidden="true">
                    {i.status === 'Expired' ? (
                      <IconClockX size={20} stroke={1.7} />
                    ) : (
                      <IconLinkOff size={20} stroke={1.7} />
                    )}
                  </span>
                  <p className={classes.historyNote}>{i.note ?? t('people.links.noNote')}</p>
                  <p className={cx(classes.historyWhat, classes.dim)}>
                    {i.status === 'Expired'
                      ? t('people.links.expired')
                      : t('people.links.cancelledStatus')}
                  </p>
                  <p className={classes.when}>{formatDate(i.cancelledAt ?? i.expiresAt)}</p>
                </li>
              ))}
            </ul>
          </Folded>
        </>
      )}
    </>
  );
}

function WaitingLink({ invitation }: { invitation: Invitation }) {
  const { t } = useTranslation();
  const cancel = useCancelInvitation();
  const note = invitation.note ?? t('people.links.noNote');

  return (
    <div className={classes.waiting}>
      <span className={classes.clock} aria-hidden="true">
        <IconClock size={20} stroke={1.7} />
      </span>
      <div style={{ minWidth: 0 }}>
        <p className={classes.name}>{note}</p>
        <p className={classes.email}>
          {t('people.links.worksUntil', {
            until: formatDate(invitation.expiresAt),
            made: formatDate(invitation.createdAt),
          })}
        </p>
      </div>
      <p className={classes.left}>
        {t('people.links.daysLeft', { count: daysUntil(invitation.expiresAt) })}
      </p>
      <Button
        radius="xl"
        variant="subtle"
        color="gray"
        className={classes.cancel}
        loading={cancel.isPending}
        aria-label={t('people.links.cancelLabel', { note })}
        onClick={() => {
          cancel.mutate(invitation.id, {
            onSuccess: () => notifications.show({ message: t('people.links.cancelled') }),
            onError: () => notifications.show({ color: 'red', message: t('people.errors.action') }),
          });
        }}
      >
        {t('people.links.cancel')}
        <span className={classes.wideOnly}>&nbsp;{t('people.links.cancelLink')}</span>
      </Button>
    </div>
  );
}

interface FoldedProps {
  group: Group;
  title: string;
  count: number;
  open: boolean;
  onToggle: (group: Group) => void;
  children: ReactNode;
}

/** A group that stays closed until clicked; the button says what it does. */
function Folded({ group, title, count, open, onToggle, children }: FoldedProps) {
  const { t } = useTranslation();
  const id = `links-${group}`;

  return (
    <section className={classes.group}>
      <UnstyledButton
        className={classes.disclosure}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          onToggle(group);
        }}
      >
        <h2 className={classes.groupTitle}>{title}</h2>
        <span className={classes.count}>{count}</span>
        <span className={classes.disclosureHint}>
          {open ? t('people.links.hide') : t('people.links.show')}
        </span>
        <IconChevronDown className={classes.chev} size={20} stroke={1.7} aria-hidden="true" />
      </UnstyledButton>
      {open && (
        <div id={id}>
          {count > 0 ? children : <p className={classes.empty}>{t('people.links.none')}</p>}
        </div>
      )}
    </section>
  );
}
