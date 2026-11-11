import {
  ActionIcon,
  Button,
  Menu,
  Skeleton,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconClock,
  IconDoorExit,
  IconDots,
  IconLink,
  IconRefresh,
  IconUserMinus,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { daysUntil, formatDate } from '../../shared/format/date';
import people from '../people/People.module.css';
import settings from '../settings/Settings.module.css';
import classes from './Family.module.css';
import {
  FAMILY_NAME_MAX,
  familyQuery,
  initialsOf,
  useCancelFamilyInvitation,
  useRenameFamily,
  type Family,
  type FamilyInvitation,
  type FamilyMember,
} from './familyApi';
import { InviteDialog, LeaveDialog, RemoveDialog } from './FamilyDialogs';
import { StartFamilyForm, WhatItMeans } from './FamilyParts';
import { useFamilyNameError } from './familyText';

const ICON = { size: 20, stroke: 1.7 } as const;

/** A section as on Settings: the title and a line on what it does on the left from 1024 px, the control on the right. */
function Section({
  title,
  text,
  children,
}: {
  title: string;
  text: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={settings.section}>
      <div>
        <h2 className={settings.title}>{title}</h2>
        <div className={settings.text}>{text}</div>
      </div>
      <div className={settings.control}>{children}</div>
    </section>
  );
}

/**
 * Family (F-023, final prototype variant 1 "Sections"): the family as Settings is, a section each for its name, its
 * members, invite links (the owner only) and leaving. With no family: start one, or how to join one.
 */
export function FamilyPage() {
  const { t } = useTranslation();
  const family = useQuery(familyQuery);

  const head = (
    <header className={settings.head}>
      <Title order={1}>{t('nav.family')}</Title>
    </header>
  );

  if (family.isPending) {
    return (
      <>
        {head}
        <div className={settings.page} role="status" aria-busy="true" aria-label={t('nav.family')}>
          {[80, 120, 140].map((width) => (
            <div key={width} className={settings.section}>
              <div>
                <Skeleton height={18} width={width} radius="sm" />
                <Skeleton height={14} width={200} radius="sm" mt={10} />
              </div>
              <Skeleton height={68} radius="md" maw={480} />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (family.isError) {
    return (
      <>
        {head}
        <div className={settings.errorBanner} role="alert">
          <IconAlertCircle {...ICON} aria-hidden />
          <div>
            <p>{t('family.loadFailed')}</p>
            <UnstyledButton
              className={settings.retry}
              onClick={() => {
                void family.refetch();
              }}
            >
              <IconRefresh {...ICON} aria-hidden />
              {t('family.retry')}
            </UnstyledButton>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {head}
      <div className={settings.page}>
        {family.data ? (
          <>
            {/* A new name starts the section again, with the saved one in the field */}
            <NameSection key={family.data.name} family={family.data} />
            <MembersSection family={family.data} />
            {family.data.isOwner && <InviteSection family={family.data} />}
            <LeaveSection family={family.data} />
          </>
        ) : (
          <>
            <Section
              title={t('family.start.title')}
              text={<WhatItMeans className={classes.meansSide} />}
            >
              <StartFamilyForm />
            </Section>
            <Section title={t('family.join.title')} text={t('family.join.text')}>
              <p className={classes.plain}>{t('family.join.how')}</p>
            </Section>
          </>
        )}
      </div>
    </>
  );
}

function NameSection({ family }: { family: Family }) {
  const { t } = useTranslation();
  const rename = useRenameFamily();
  const nameError = useFamilyNameError();
  const saved = family.name;
  const [name, setName] = useState(saved);
  const changed = name.trim() !== saved;
  const error = nameError(name, changed);

  if (!family.isOwner) {
    return (
      <Section title={t('family.nameSection.title')} text={t('family.nameSection.memberText')}>
        <p className={classes.familyName}>{saved}</p>
      </Section>
    );
  }
  return (
    <Section title={t('family.nameSection.title')} text={t('family.nameSection.ownerText')}>
      <TextInput
        aria-label={t('family.nameSection.label')}
        value={name}
        maxLength={FAMILY_NAME_MAX}
        error={error}
        onChange={(event) => {
          setName(event.currentTarget.value);
        }}
      />
      {changed && (
        <div className={settings.buttons}>
          <Button
            variant="quiet"
            onClick={() => {
              setName(saved);
            }}
          >
            {t('family.nameSection.cancel')}
          </Button>
          <Button
            loading={rename.isPending}
            onClick={() => {
              if (nameError(name, true)) return;
              rename.mutate(name, {
                onSuccess: () => notifications.show({ message: t('family.nameSection.saved') }),
                onError: () => notifications.show({ color: 'red', message: t('family.failed') }),
              });
            }}
          >
            {t('family.nameSection.save')}
          </Button>
        </div>
      )}
    </Section>
  );
}

function MembersSection({ family }: { family: Family }) {
  const { t } = useTranslation();
  const [removing, setRemoving] = useState<FamilyMember | null>(null);

  return (
    <Section title={t('family.members.title')} text={t('family.members.text')}>
      <ul className={classes.rows}>
        {family.members.map((m) => (
          <li key={m.id} className={classes.row}>
            <span className={people.initials} aria-hidden="true">
              {initialsOf(m.displayName)}
            </span>
            <div className={classes.rowText}>
              <p className={people.name}>
                {m.displayName}
                {m.isYou && <span className={people.tag}>{t('family.members.you')}</span>}
                {m.isOwner && <span className={people.tag}>{t('family.members.owner')}</span>}
              </p>
              <p className={people.email}>
                {m.startedFamily
                  ? t('family.members.started', { date: formatDate(m.joinedAt) })
                  : t('family.members.joined', { date: formatDate(m.joinedAt) })}
              </p>
            </div>
            {family.isOwner && !m.isYou ? (
              <Menu position="bottom-end" shadow="md" width={230}>
                <Menu.Target>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label={t('family.members.actions', { name: m.displayName })}
                  >
                    <IconDots {...ICON} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    color="var(--pup-color-danger)"
                    leftSection={<IconUserMinus {...ICON} />}
                    onClick={() => {
                      setRemoving(m);
                    }}
                  >
                    {t('family.members.remove')}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <span />
            )}
          </li>
        ))}
      </ul>
      <RemoveDialog
        member={removing}
        onClose={() => {
          setRemoving(null);
        }}
      />
    </Section>
  );
}

function InviteSection({ family }: { family: Family }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Section title={t('family.invite.title')} text={t('family.invite.text')}>
      <div>
        <Button
          leftSection={<IconLink {...ICON} />}
          onClick={() => {
            setOpen(true);
          }}
        >
          {t('family.invite.create')}
        </Button>
      </div>
      {family.invitations.length > 0 && (
        <div>
          <p className={classes.subhead}>{t('family.invite.waiting')}</p>
          {family.invitations.map((invitation) => (
            <WaitingLink key={invitation.id} invitation={invitation} />
          ))}
        </div>
      )}
      <InviteDialog
        familyName={family.name}
        opened={open}
        onClose={() => {
          setOpen(false);
        }}
      />
    </Section>
  );
}

/** A link waiting to be opened. It is shown only once (F-028): it can't be copied again, only cancelled. */
function WaitingLink({ invitation }: { invitation: FamilyInvitation }) {
  const { t } = useTranslation();
  const cancel = useCancelFamilyInvitation();
  const label = invitation.note
    ? t('family.invite.forNote', { note: invitation.note })
    : t('family.invite.noNote');

  return (
    <div className={people.waiting}>
      <span className={people.clock} aria-hidden="true">
        <IconClock {...ICON} />
      </span>
      <div className={classes.rowText}>
        <p className={people.name}>{label}</p>
        <p className={people.email}>
          {t('family.invite.worksUntil', { date: formatDate(invitation.expiresAt) })}
        </p>
      </div>
      <p className={people.left}>
        {t('family.invite.daysLeft', { count: daysUntil(invitation.expiresAt) })}
      </p>
      <Button
        variant="quiet"
        className={people.cancel}
        loading={cancel.isPending}
        aria-label={t('family.invite.cancelLabel', { note: label })}
        onClick={() => {
          cancel.mutate(invitation.id, {
            onSuccess: () => notifications.show({ message: t('family.invite.cancelled') }),
            onError: () => notifications.show({ color: 'red', message: t('family.failed') }),
          });
        }}
      >
        {t('family.invite.cancel')}
      </Button>
    </div>
  );
}

function LeaveSection({ family }: { family: Family }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const deletes = family.isOwner && family.members.length <= 1;

  return (
    <Section
      title={deletes ? t('family.leave.deleteTitle') : t('family.leave.title')}
      text={
        deletes
          ? t('family.leave.aloneText')
          : family.isOwner
            ? t('family.leave.ownerText')
            : t('family.leave.memberText')
      }
    >
      <div>
        <Button
          variant="danger-quiet"
          leftSection={<IconDoorExit {...ICON} />}
          onClick={() => {
            setOpen(true);
          }}
        >
          {deletes ? t('family.leave.deleteButton') : t('family.leave.button')}
        </Button>
      </div>
      <LeaveDialog
        family={family}
        opened={open}
        onClose={() => {
          setOpen(false);
        }}
      />
    </Section>
  );
}
