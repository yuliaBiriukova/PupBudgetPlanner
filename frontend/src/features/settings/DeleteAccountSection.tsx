import { Button, Loader, Skeleton, UnstyledButton } from '@mantine/core';
import { IconAlertCircle, IconCircleCheck, IconTrash } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useState, type ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { currentUserQuery } from '../auth/authApi';
import { PasswordField, TextField } from '../auth/AuthFormParts';
import { GoogleLogo } from '../auth/GoogleLogo';
import { familyQuery, type Family } from '../family/familyApi';
import { useNamesList } from '../family/familyText';
import pills from '../../shared/ui/Pills.module.css';
import { cx } from '../../shared/ui/cx';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import {
  DELETE_PARAM,
  DELETE_WORD,
  DeleteAccountError,
  deletionQuery,
  GOOGLE_CONFIRM_URL,
  isDeleteWord,
  useDeleteAccount,
  type DeletionSummary,
} from './deleteAccountApi';
import classes from './DeleteAccount.module.css';
import settings from './Settings.module.css';

const ICON = { size: 20, stroke: 1.7 } as const;

/** Where the person lands after deleting: the sign-in frame saying so (`AccountDeletedPage`). */
export const DELETED_PATH = '/account-deleted';

type Errors = Partial<Record<'heir' | 'proof' | 'word' | 'form', string>>;

/**
 * Delete account (F-027, final prototype): the last section of Settings, apart from the others, with a red word
 * button; everything is asked in one pop-up. The admin gets a line why instead (they can't delete their account).
 */
export function DeleteAccountSection() {
  const { t } = useTranslation();
  const summary = useQuery(deletionQuery);
  const [params, setParams] = useSearchParams();
  const titleId = useId();
  // Back from "Confirm with Google" (`?delete=google|google-failed|open`): the dialog opens again
  const returned = params.get(DELETE_PARAM);
  const [opened, setOpened] = useState(returned !== null);
  const [googleFailed, setGoogleFailed] = useState(returned === 'google-failed');

  useEffect(() => {
    if (returned === null) return;
    setParams(
      (current) => {
        current.delete(DELETE_PARAM);
        return current;
      },
      { replace: true },
    );
  }, [returned, setParams]);

  return (
    <section className={cx(settings.section, classes.apart)} aria-labelledby={titleId}>
      <div className={settings.about}>
        <h2 id={titleId} className={settings.title}>
          {t('settings.delete.title')}
        </h2>
        <p className={settings.text}>{t('settings.delete.text')}</p>
      </div>
      <div className={settings.control}>
        {summary.data?.canDelete === false ? (
          <p className={classes.adminLine}>{t('settings.delete.admin')}</p>
        ) : (
          <div>
            <Button
              variant="danger-quiet"
              className={classes.start}
              leftSection={<IconTrash {...ICON} aria-hidden />}
              onClick={() => {
                setOpened(true);
              }}
            >
              {t('settings.delete.button')}
            </Button>
          </div>
        )}
      </div>
      <DeleteAccountDialog
        opened={opened}
        googleFailed={googleFailed}
        onClose={() => {
          setOpened(false);
          setGoogleFailed(false);
        }}
      />
    </section>
  );
}

function DeleteAccountDialog({
  opened,
  googleFailed,
  onClose,
}: {
  opened: boolean;
  googleFailed: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const summary = useQuery({ ...deletionQuery, enabled: opened });
  const family = useQuery({ ...familyQuery, enabled: opened });
  const user = useQuery(currentUserQuery);
  const remove = useDeleteAccount();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [heir, setHeir] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [word, setWord] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const others = family.data?.members.filter((m) => !m.isYou) ?? [];
  const picksHeir = family.data?.isOwner === true && others.length > 0;
  const withPassword = summary.data?.hasPassword !== false;

  const close = () => {
    onClose();
    setHeir(null);
    setPassword('');
    setWord('');
    setErrors({});
    remove.reset();
  };

  const submit = () => {
    const found: Errors = {};
    if (picksHeir && !heir) found.heir = t('settings.delete.errors.heir');
    if (withPassword && !password) found.proof = t('settings.delete.errors.password');
    if (!withPassword && !summary.data?.googleConfirmed)
      found.proof = t('settings.delete.errors.google');
    if (!isDeleteWord(word)) found.word = t('settings.delete.errors.word', { word: DELETE_WORD });
    setErrors(found);
    if (Object.keys(found).length > 0 || !summary.data) return;

    remove.mutate(
      { word, password: withPassword ? password : null, newOwnerId: picksHeir ? heir : null },
      {
        onSuccess: () => {
          // Off the signed-in pages first, so nothing asks for the sign-in page on the way
          void navigate(DELETED_PATH, { replace: true });
          queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'health' });
          queryClient.setQueryData(currentUserQuery.queryKey, null);
        },
        onError: (error) => {
          setErrors(errorsFrom(error, t));
        },
      },
    );
  };

  return (
    <ResponsiveDialog
      opened={opened}
      onClose={close}
      title={t('settings.delete.dialogTitle')}
      footer={
        <>
          <Button variant="quiet" onClick={close}>
            {t('settings.delete.keep')}
          </Button>
          <Button variant="danger" loading={remove.isPending} onClick={submit}>
            {t('settings.delete.confirm')}
          </Button>
        </>
      }
    >
      <div className={classes.body}>
        <div className={classes.summary}>
          <p className={classes.lead}>{t('settings.delete.lead')}</p>
          <WhatGoes summary={summary.data} failed={summary.isError} />
        </div>
        {family.data && (
          <FamilyPart
            family={family.data}
            others={others.map((m) => ({ id: m.id, name: m.displayName }))}
            picksHeir={picksHeir}
            heir={heir}
            error={errors.heir}
            onPick={(id) => {
              setHeir(id);
              setErrors((e) => ({ ...e, heir: undefined }));
            }}
          />
        )}
        <Part title={t('settings.delete.proofTitle')}>
          {withPassword ? (
            <PasswordField
              label={t('settings.delete.password')}
              value={password}
              autoComplete="current-password"
              error={errors.proof}
              onChange={(event) => {
                setPassword(event.currentTarget.value);
                setErrors((e) => ({ ...e, proof: undefined }));
              }}
            />
          ) : (
            <GoogleProof
              confirmed={summary.data?.googleConfirmed === true}
              email={user.data?.email ?? ''}
              error={
                errors.proof ??
                (googleFailed ? t('settings.delete.errors.googleFailed') : undefined)
              }
            />
          )}
        </Part>
        <Part title={t('settings.delete.wordTitle', { word: DELETE_WORD })}>
          <TextField
            aria-label={t('settings.delete.wordTitle', { word: DELETE_WORD })}
            value={word}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            error={errors.word}
            onChange={(event) => {
              setWord(event.currentTarget.value);
              setErrors((e) => ({ ...e, word: undefined }));
            }}
          />
        </Part>
        <p className={classes.note}>{t('settings.delete.cantUndo')}</p>
        {errors.form && <FieldError text={errors.form} />}
      </div>
    </ResponsiveDialog>
  );
}

/** Field errors from the API under their parts; anything else for the whole dialog. */
function errorsFrom(error: Error, t: TFunction): Errors {
  if (!(error instanceof DeleteAccountError)) return { form: t('settings.delete.errors.failed') };
  const { failure } = error;
  switch (failure.kind) {
    case 'fields':
      return {
        heir: failure.fields.newOwnerId ? t('settings.delete.errors.heir') : undefined,
        proof: failure.fields.password ? t('settings.delete.errors.wrongPassword') : undefined,
        word: failure.fields.word
          ? t('settings.delete.errors.word', { word: DELETE_WORD })
          : undefined,
      };
    case 'google':
      return { proof: t('settings.delete.errors.google') };
    case 'lockedOut':
      return { proof: t('settings.delete.errors.lockedOut') };
    case 'admin':
      return { form: t('settings.delete.admin') };
    default:
      return { form: t('settings.delete.errors.failed') };
  }
}

/** What goes, in a grey line: the person's own counts, and that the money stays in the banks. */
function WhatGoes({ summary, failed }: { summary?: DeletionSummary; failed: boolean }) {
  const { t, i18n } = useTranslation();
  if (failed) return <p className={classes.note}>{t('settings.delete.whatGoesFallback')}</p>;
  if (!summary) {
    return (
      <div role="status" aria-label={t('settings.delete.loading')}>
        <Skeleton height={14} radius="sm" mt={4} />
        <Skeleton height={14} width="70%" radius="sm" mt={8} />
      </div>
    );
  }
  // The API's whole numbers can come typed as strings; grouped with a no-break space (1 284)
  const counted = (key: 'accounts' | 'transactions' | 'categories') => {
    const count = Number(summary[key]);
    const n = new Intl.NumberFormat(i18n.language).format(count).replace(/[,s]/g, ' ');
    return t(`settings.delete.${key}`, { count, n });
  };
  return (
    <p className={classes.note}>
      {t('settings.delete.whatGoes', {
        accounts: counted('accounts'),
        transactions: counted('transactions'),
        categories: counted('categories'),
      })}{' '}
      {t('settings.delete.moneyStays')}
    </p>
  );
}

/** A part of the confirmation: a short title and its control. */
function Part({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className={classes.part}>
      <h3 className={classes.partTitle}>{title}</h3>
      {text && <p className={classes.partText}>{text}</p>}
      {children}
    </div>
  );
}

/** A member leaves; an owner with others picks who looks after the family next (as "Leave family"). */
function FamilyPart({
  family,
  others,
  picksHeir,
  heir,
  error,
  onPick,
}: {
  family: Family;
  others: { id: string; name: string }[];
  picksHeir: boolean;
  heir: string | null;
  error?: string;
  onPick: (id: string) => void;
}) {
  const { t } = useTranslation();
  const namesList = useNamesList();
  const labelId = useId();
  const name = family.name;

  if (!picksHeir) {
    return (
      <Part
        title={t('settings.delete.leaveTitle', { name })}
        text={
          others.length === 0
            ? t('settings.delete.leaveAlone')
            : t('settings.delete.leaveText', { names: namesList(others.map((o) => o.name)) })
        }
      />
    );
  }

  return (
    <div className={classes.part}>
      <h3 className={classes.partTitle} id={labelId}>
        {t('settings.delete.heirTitle')}
      </h3>
      <p className={classes.partText}>{t('settings.delete.heirText', { name })}</p>
      <div className={pills.pills} role="radiogroup" aria-labelledby={labelId}>
        {others.map((other) => (
          <UnstyledButton
            key={other.id}
            className={pills.pill}
            role="radio"
            aria-checked={heir === other.id}
            onClick={() => {
              onPick(other.id);
            }}
          >
            {other.name}
          </UnstyledButton>
        ))}
      </div>
      {error && <FieldError text={error} />}
    </div>
  );
}

/** Someone with only Google: to Google and back, then "Confirmed with Google as …". */
function GoogleProof({
  confirmed,
  email,
  error,
}: {
  confirmed: boolean;
  email: string;
  error?: string;
}) {
  const { t } = useTranslation();
  const [leaving, setLeaving] = useState(false);

  // Back from Google with the browser's Back button: the page comes back as it was left
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setLeaving(false);
    };
    window.addEventListener('pageshow', reset);
    return () => {
      window.removeEventListener('pageshow', reset);
    };
  }, []);

  if (confirmed) {
    return (
      <p className={classes.confirmed}>
        <IconCircleCheck {...ICON} aria-hidden />
        {t('settings.delete.googleConfirmed', { email })}
      </p>
    );
  }
  return (
    <>
      <p className={classes.partText}>{t('settings.delete.googleText')}</p>
      <Button
        component="a"
        href={GOOGLE_CONFIRM_URL}
        variant="default"
        className={classes.google}
        aria-busy={leaving || undefined}
        leftSection={
          leaving ? <Loader size={18} color="currentColor" aria-hidden /> : <GoogleLogo />
        }
        onClick={() => {
          setLeaving(true);
        }}
      >
        {leaving ? t('settings.delete.openingGoogle') : t('settings.delete.google')}
      </Button>
      {error && <FieldError text={error} />}
    </>
  );
}

function FieldError({ text }: { text: string }) {
  return (
    <p className={classes.fieldError} role="alert">
      <IconAlertCircle size={16} stroke={1.7} aria-hidden />
      {text}
    </p>
  );
}
