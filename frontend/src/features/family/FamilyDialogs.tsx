import { Button, TextInput, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconCopy,
  IconDoorExit,
  IconLink,
  IconShare,
  IconUserMinus,
} from '@tabler/icons-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../shared/format/date';
import { cx } from '../../shared/ui/cx';
import pills from '../../shared/ui/Pills.module.css';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import { useDesktopAutofocus } from '../../shared/ui/useDesktopAutofocus';
import people from '../people/People.module.css';
import classes from './Family.module.css';
import {
  familyInviteUrl,
  LINK_DAYS,
  NOTE_MAX,
  useCreateFamilyInvitation,
  useLeaveFamily,
  useRemoveFromFamily,
  type CreatedFamilyInvitation,
  type Family,
  type FamilyMember,
} from './familyApi';
import { useNamesList } from './familyText';

const ICON = { size: 20, stroke: 1.7 } as const;

interface InviteDialogProps {
  familyName: string;
  opened: boolean;
  onClose: () => void;
}

/** A new invite link: who it is for (optional), then the link with Copy and Share. Shown only here, once (F-028). */
export function InviteDialog({ familyName, opened, onClose }: InviteDialogProps) {
  const { t } = useTranslation();
  const create = useCreateFamilyInvitation();
  const [note, setNote] = useState('');
  const [made, setMade] = useState<CreatedFamilyInvitation | null>(null);
  const [copied, setCopied] = useState(false);
  const formId = useId();
  const autofocus = useDesktopAutofocus();

  const close = () => {
    onClose();
    setNote('');
    setMade(null);
    setCopied(false);
    create.reset();
  };

  if (made) {
    const url = familyInviteUrl(made.token);
    const canShare = typeof navigator.share === 'function';
    return (
      <ResponsiveDialog
        opened={opened}
        onClose={close}
        title={t('family.inviteDialog.readyTitle')}
        footer={
          <Button variant="quiet" onClick={close}>
            {t('family.inviteDialog.done')}
          </Button>
        }
      >
        <div className={people.linkCard}>
          <p className={people.linkFor}>
            {made.note
              ? t('family.invite.forNote', { note: made.note })
              : t('family.invite.noNote')}
          </p>
          <TextInput
            readOnly
            value={url}
            aria-label={t('family.inviteDialog.linkLabel')}
            classNames={{ input: people.linkInput }}
            onFocus={(event) => {
              event.currentTarget.select();
            }}
          />
          <div className={cx(people.linkButtons, !canShare && classes.oneButton)}>
            <Button
              leftSection={copied ? <IconCheck {...ICON} /> : <IconCopy {...ICON} />}
              onClick={() => {
                void navigator.clipboard
                  .writeText(url)
                  .catch(() => undefined)
                  .then(() => {
                    setCopied(true);
                    notifications.show({ message: t('family.inviteDialog.copied') });
                  });
              }}
            >
              {copied ? t('family.inviteDialog.copiedButton') : t('family.inviteDialog.copy')}
            </Button>
            {canShare && (
              <Button
                variant="quiet"
                leftSection={<IconShare {...ICON} />}
                onClick={() => {
                  void navigator
                    .share({
                      url,
                      title: t('family.inviteDialog.shareTitle', { name: familyName }),
                    })
                    .catch(() => undefined);
                }}
              >
                {t('family.inviteDialog.share')}
              </Button>
            )}
          </div>
        </div>
        <p className={people.dialogText}>
          {t('family.inviteDialog.send', { date: formatDate(made.expiresAt), name: familyName })}
        </p>
      </ResponsiveDialog>
    );
  }

  return (
    <ResponsiveDialog
      opened={opened}
      onClose={close}
      title={t('family.inviteDialog.title')}
      footer={
        <>
          <Button variant="quiet" onClick={close}>
            {t('family.inviteDialog.cancel')}
          </Button>
          <Button
            type="submit"
            form={formId}
            loading={create.isPending}
            leftSection={<IconLink {...ICON} />}
          >
            {t('family.inviteDialog.create')}
          </Button>
        </>
      }
    >
      <p className={cx(people.dialogText, people.dim, classes.first)}>
        {t('family.inviteDialog.lead', { days: LINK_DAYS, name: familyName })}
      </p>
      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate(note, {
            onSuccess: setMade,
            onError: () => notifications.show({ color: 'red', message: t('family.failed') }),
          });
        }}
      >
        <TextInput
          mt={16}
          label={t('family.inviteDialog.noteLabel')}
          description={t('family.inviteDialog.noteHint')}
          placeholder={t('family.inviteDialog.notePlaceholder')}
          value={note}
          maxLength={NOTE_MAX}
          data-autofocus={autofocus}
          onChange={(event) => {
            setNote(event.currentTarget.value);
          }}
        />
      </form>
    </ResponsiveDialog>
  );
}

/** Remove someone from the family: the owner only. */
export function RemoveDialog({
  member,
  onClose,
}: {
  member: FamilyMember | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const remove = useRemoveFromFamily();
  // The dialog keeps its text while it closes
  const [last, setLast] = useState(member);
  if (member && member !== last) setLast(member);
  const shown = member ?? last;
  const name = shown?.displayName ?? '';

  return (
    <ResponsiveDialog
      opened={member !== null}
      onClose={onClose}
      title={t('family.remove.title', { name })}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            {t('family.remove.keep', { name })}
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            leftSection={<IconUserMinus {...ICON} />}
            onClick={() => {
              if (!shown) return;
              remove.mutate(shown.id, {
                onSuccess: () => {
                  notifications.show({ message: t('family.remove.done', { name }) });
                  onClose();
                },
                onError: () => notifications.show({ color: 'red', message: t('family.failed') }),
              });
            }}
          >
            {t('family.remove.confirm')}
          </Button>
        </>
      }
    >
      <p className={cx(people.dialogText, classes.first)}>{t('family.remove.text', { name })}</p>
      <p className={cx(people.dialogText, people.dim)}>{t('family.remove.nothingDeleted')}</p>
    </ResponsiveDialog>
  );
}

/** Leave the family. An owner with others names who looks after it now; an owner alone deletes it. */
export function LeaveDialog({
  family,
  opened,
  onClose,
}: {
  family: Family;
  opened: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const leave = useLeaveFamily();
  const namesList = useNamesList();
  const others = family.members.filter((m) => !m.isYou);
  const [heir, setHeir] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const alone = others.length === 0;
  const deletes = alone && family.isOwner;
  const name = family.name;
  const pickId = useId();

  const close = () => {
    onClose();
    setHeir(null);
    setMissing(false);
  };

  return (
    <ResponsiveDialog
      opened={opened}
      onClose={close}
      title={
        deletes
          ? t('family.leave.deleteDialogTitle', { name })
          : t('family.leave.dialogTitle', { name })
      }
      footer={
        <>
          <Button variant="quiet" onClick={close}>
            {t('family.leave.stay')}
          </Button>
          <Button
            variant="danger"
            loading={leave.isPending}
            leftSection={<IconDoorExit {...ICON} />}
            onClick={() => {
              if (family.isOwner && !alone && !heir) {
                setMissing(true);
                return;
              }
              leave.mutate(family.isOwner ? heir : null, {
                onSuccess: () => {
                  notifications.show({
                    message: deletes
                      ? t('family.leave.deleted', { name })
                      : t('family.leave.left', { name }),
                  });
                  close();
                },
                onError: () => notifications.show({ color: 'red', message: t('family.failed') }),
              });
            }}
          >
            {deletes ? t('family.leave.deleteButton') : t('family.leave.button')}
          </Button>
        </>
      }
    >
      {alone ? (
        <p className={cx(people.dialogText, classes.first)}>{t('family.leave.aloneDialogText')}</p>
      ) : (
        <>
          <p className={cx(people.dialogText, classes.first)}>
            {t('family.leave.dialogText', { names: namesList(others.map((m) => m.displayName)) })}
          </p>
          {family.isOwner && (
            <div className={classes.heir}>
              <p className={classes.heirLabel} id={pickId}>
                {t('family.leave.heirLabel')}
              </p>
              <p className={cx(people.dialogText, people.dim, classes.first)}>
                {t('family.leave.heirText')}
              </p>
              <div className={pills.pills} role="radiogroup" aria-labelledby={pickId}>
                {others.map((m) => (
                  <UnstyledButton
                    key={m.id}
                    className={pills.pill}
                    role="radio"
                    aria-checked={heir === m.id}
                    onClick={() => {
                      setHeir(m.id);
                      setMissing(false);
                    }}
                  >
                    {m.displayName}
                  </UnstyledButton>
                ))}
              </div>
              {missing && (
                <p className={cx(people.dialogText, people.danger)} role="alert">
                  {t('family.leave.heirMissing')}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </ResponsiveDialog>
  );
}
