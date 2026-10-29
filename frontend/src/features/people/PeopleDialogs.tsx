import { Button, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBan, IconCheck, IconCopy, IconLink, IconShare, IconTrash } from '@tabler/icons-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '../../shared/ui/cx';
import { formatDate } from '../../shared/format/date';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import classes from './People.module.css';
import {
  inviteUrl,
  MAX_PICKS,
  PeopleActionError,
  useCreateInvitation,
  usePeopleAction,
  type CreatedInvitation,
  type Person,
} from './peopleApi';

const NOTE_MAX = 60;

interface NewLinkDialogProps {
  opened: boolean;
  onClose: () => void;
  /** After Done: the Invite links tab shows the new link. */
  onDone: () => void;
}

/** New invite link: an optional note, then the link with Copy and Share. It is shown only here, once. */
export function NewLinkDialog({ opened, onClose, onDone }: NewLinkDialogProps) {
  const { t } = useTranslation();
  const create = useCreateInvitation();
  const [note, setNote] = useState('');
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  const [copied, setCopied] = useState(false);
  const formId = useId();

  const close = () => {
    onClose();
    setNote('');
    setCreated(null);
    setCopied(false);
    create.reset();
  };

  if (created) {
    const url = inviteUrl(created.token);
    const who = created.note ?? t('people.links.noNote');
    const canShare = typeof navigator.share === 'function';
    return (
      <ResponsiveDialog
        opened={opened}
        onClose={close}
        title={t('people.newLink.readyTitle')}
        footer={
          <Button
            radius="xl"
            variant="subtle"
            color="gray"
            onClick={() => {
              close();
              onDone();
            }}
          >
            {t('people.newLink.done')}
          </Button>
        }
      >
        <div className={classes.linkCard}>
          <p className={classes.linkFor}>{who}</p>
          <TextInput
            readOnly
            value={url}
            aria-label={t('people.newLink.linkLabel')}
            classNames={{ input: classes.linkInput }}
            onFocus={(event) => {
              event.currentTarget.select();
            }}
          />
          <div
            className={classes.linkButtons}
            style={canShare ? undefined : { gridTemplateColumns: '1fr' }}
          >
            <Button
              radius="xl"
              leftSection={
                copied ? <IconCheck size={20} stroke={1.7} /> : <IconCopy size={20} stroke={1.7} />
              }
              onClick={() => {
                void navigator.clipboard.writeText(url).then(() => {
                  setCopied(true);
                  notifications.show({ message: t('people.newLink.copied') });
                });
              }}
            >
              {copied ? t('people.newLink.copiedButton') : t('people.newLink.copy')}
            </Button>
            {canShare && (
              <Button
                radius="xl"
                variant="default"
                leftSection={<IconShare size={20} stroke={1.7} />}
                onClick={() => {
                  void navigator.share({ url, title: t('app.shortName') }).catch(() => undefined);
                }}
              >
                {t('people.newLink.share')}
              </Button>
            )}
          </div>
        </div>
        <p className={classes.dialogText}>
          {t('people.newLink.send', { date: formatDate(created.expiresAt) })}
        </p>
        <p className={cx(classes.dialogText, classes.dim)} style={{ fontSize: 14 }}>
          {t('people.newLink.once')}
        </p>
      </ResponsiveDialog>
    );
  }

  // The pinned buttons sit outside the form, so Create link names it with `form`
  return (
    <ResponsiveDialog
      opened={opened}
      onClose={close}
      title={t('people.newLink.title')}
      footer={
        <>
          <Button radius="xl" variant="subtle" color="gray" onClick={close}>
            {t('people.cancel')}
          </Button>
          <Button
            radius="xl"
            type="submit"
            form={formId}
            loading={create.isPending}
            leftSection={<IconLink size={20} stroke={1.7} />}
          >
            {t('people.newLink.create')}
          </Button>
        </>
      }
    >
      <p className={cx(classes.dialogText, classes.dim)} style={{ marginTop: 0 }}>
        {t('people.newLink.intro')}
      </p>
      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (create.isPending) return;
          create.mutate(note, { onSuccess: setCreated });
        }}
      >
        <TextInput
          mt={18}
          label={t('people.newLink.noteLabel')}
          value={note}
          maxLength={NOTE_MAX}
          onChange={(event) => {
            setNote(event.currentTarget.value);
          }}
          classNames={{ input: classes.field }}
          data-autofocus
        />
        {create.isError && (
          <p className={cx(classes.dialogText, classes.danger)} role="alert">
            {t('people.errors.action')}
          </p>
        )}
      </form>
    </ResponsiveDialog>
  );
}

interface ConfirmProps {
  /** The people the action is for: one from a row's menu, or everyone picked. */
  people: Person[];
  onClose: () => void;
  onDone: () => void;
}

function firstName(person: Person) {
  return person.displayName.split(' ')[0] ?? person.displayName;
}

function Names({ people }: { people: Person[] }) {
  return (
    <ul className={classes.names}>
      {people.map((p) => (
        <li key={p.id}>
          <b style={{ fontWeight: 500 }}>{p.displayName}</b>{' '}
          <span className={classes.dim}>{p.email}</span>
        </li>
      ))}
    </ul>
  );
}

/** Why Block or Delete didn't go through: "try again" helps, unless the API refused the request itself (400). */
function ActionError({ error }: { error: Error | null }) {
  const { t } = useTranslation();
  if (!error) return null;
  return (
    <p className={cx(classes.dialogText, classes.danger)} role="alert">
      {error instanceof PeopleActionError && error.status === 400
        ? t('people.errors.tooMany', { max: MAX_PICKS })
        : t('people.errors.action')}
    </p>
  );
}

/** Block asks first and says what happens: signed out everywhere, data kept, can be undone. */
export function BlockDialog({ people, onClose, onDone }: ConfirmProps) {
  const { t } = useTranslation();
  const action = usePeopleAction();
  const one = people.length === 1 ? people[0] : undefined;

  return (
    <ResponsiveDialog
      opened={people.length > 0}
      onClose={onClose}
      title={
        one
          ? t('people.block.titleOne', { name: one.displayName })
          : t('people.block.titleMany', { count: people.length })
      }
      footer={
        <>
          <Button radius="xl" variant="subtle" color="gray" onClick={onClose}>
            {t('people.cancel')}
          </Button>
          <Button
            radius="xl"
            loading={action.isPending}
            leftSection={<IconBan size={20} stroke={1.7} />}
            onClick={() => {
              action.mutate(
                { action: 'block', userIds: people.map((p) => p.id) },
                {
                  onSuccess: () => {
                    notifications.show({
                      message: one
                        ? t('people.block.doneOne', { name: firstName(one) })
                        : t('people.block.doneMany', { count: people.length }),
                    });
                    onDone();
                  },
                },
              );
            }}
          >
            {one
              ? t('people.block.confirm')
              : t('people.block.confirmMany', { count: people.length })}
          </Button>
        </>
      }
    >
      {!one && <Names people={people} />}
      <p className={classes.dialogText}>
        {one ? t('people.block.textOne', { name: firstName(one) }) : t('people.block.textMany')}
      </p>
      <ActionError error={action.error} />
    </ResponsiveDialog>
  );
}

/**
 * Delete asks first, says what goes and can't be undone, and works only once the person's email (one) or the word
 * "delete" (several) is typed in.
 */
export function DeleteDialog({ people, onClose, onDone }: ConfirmProps) {
  const { t } = useTranslation();
  const action = usePeopleAction();
  const [typed, setTyped] = useState('');
  const one = people.length === 1 ? people[0] : undefined;
  const expected = one ? one.email.toLocaleLowerCase() : t('people.delete.word');
  const ready = typed.trim().toLocaleLowerCase() === expected;
  const close = () => {
    setTyped('');
    onClose();
  };

  return (
    <ResponsiveDialog
      opened={people.length > 0}
      onClose={close}
      title={
        one
          ? t('people.delete.titleOne', { name: firstName(one) })
          : t('people.delete.titleMany', { count: people.length })
      }
      footer={
        <>
          <Button radius="xl" variant="subtle" color="gray" onClick={close}>
            {t('people.cancel')}
          </Button>
          <Button
            radius="xl"
            className={classes.dangerButton}
            disabled={!ready}
            loading={action.isPending}
            leftSection={<IconTrash size={20} stroke={1.7} />}
            onClick={() => {
              action.mutate(
                { action: 'delete', userIds: people.map((p) => p.id) },
                {
                  onSuccess: () => {
                    notifications.show({
                      message: one
                        ? t('people.delete.doneOne', { name: firstName(one) })
                        : t('people.delete.doneMany', { count: people.length }),
                    });
                    setTyped('');
                    onDone();
                  },
                },
              );
            }}
          >
            {one
              ? t('people.delete.confirm')
              : t('people.delete.confirmMany', { count: people.length })}
          </Button>
        </>
      }
    >
      {!one && <Names people={people} />}
      <p className={classes.dialogText}>
        {one ? t('people.delete.textOne') : t('people.delete.textMany')}
      </p>
      {one && (
        <p className={cx(classes.dialogText, classes.dim)}>
          {t('people.delete.again', { name: firstName(one) })}
        </p>
      )}
      <TextInput
        mt={18}
        classNames={{ input: classes.field }}
        label={
          one ? t('people.delete.typeEmail', { email: one.email }) : t('people.delete.typeWord')
        }
        value={typed}
        autoComplete="off"
        autoCapitalize="none"
        onChange={(event) => {
          setTyped(event.currentTarget.value);
        }}
      />
      <ActionError error={action.error} />
    </ResponsiveDialog>
  );
}
