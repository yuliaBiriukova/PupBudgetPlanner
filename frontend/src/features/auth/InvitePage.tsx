import { Button, Loader } from '@mantine/core';
import { IconLock, IconTicket } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { formatDate } from '../../shared/format/date';
import { cx } from '../../shared/ui/cx';
import familyClasses from '../family/Family.module.css';
import { useNamesList } from '../family/familyText';
import {
  AuthError,
  InvitationGoneError,
  invitationPreviewQuery,
  useRegister,
  type AuthLocationState,
  type InvitationPreview,
} from './authApi';
import classes from './AuthForm.module.css';
import invite from './Invite.module.css';
import { SignUpForm } from './SignUpForm';
import { useWakeNote } from './useWakeNote';

/**
 * The invite page for someone without an account (F-028): who invited and until when, then Create account and
 * Continue with Google with the link's token. A family's link names the family; the account joins it (F-023). A link
 * that doesn't work gets one neutral page.
 */
export function InvitePage({ token }: { token: string }) {
  const { t } = useTranslation();
  const preview = useQuery(invitationPreviewQuery(token));
  const register = useRegister();
  const notice = useWakeNote();
  const namesList = useNamesList();

  if (preview.isPending) return <InviteChecking />;
  if (preview.error instanceof InvitationGoneError) return <InvitationGone />;
  if (preview.isError) {
    return (
      <InviteCheckFailed
        onRetry={() => {
          void preview.refetch();
        }}
      />
    );
  }

  const failure =
    register.error instanceof AuthError
      ? register.error.failure
      : register.error
        ? 'unknown'
        : null;
  const family = preview.data.family;
  // Back to this link after signing in, so someone who already has an account can join the family with it
  const back: AuthLocationState = { from: `/invite/${token}` };
  return (
    <>
      <Invited preview={preview.data} />
      {family && (
        <p className={familyClasses.joinNote}>
          {t('family.joinPage.newNote', {
            names: namesList(family.members.map((m) => m.displayName)),
          })}
        </p>
      )}
      <SignUpForm
        inviteToken={token}
        googleReturnTo={family ? back.from : undefined}
        onSubmit={(values) => {
          // Once the account is made, InviteRoute takes the person on (to Family for a family's link)
          register.mutate(values);
        }}
        pending={register.isPending}
        failure={failure}
        notice={notice}
      />
      <p className={invite.foot}>
        {t('auth.invite.haveAccount')}{' '}
        <Link to="/sign-in" state={family ? back : undefined} className={invite.footLink}>
          {t('auth.signIn')}
        </Link>
      </p>
    </>
  );
}

/** "Yulia invited you to Pup Budget", or for a family's link "Andriy invites you to the Kovalenko family". */
export function Invited({ preview }: { preview: InvitationPreview }) {
  const { t } = useTranslation();
  const family = preview.family;

  return (
    <div className={invite.invited}>
      <IconTicket className={invite.invitedIcon} size={20} stroke={1.7} aria-hidden="true" />
      <div>
        <p className={invite.invitedTitle}>
          {family
            ? t('family.joinPage.invites', { name: preview.inviterName, family: family.name })
            : t('auth.invite.invited', { name: preview.inviterName })}
        </p>
        <p className={invite.invitedText}>
          {family
            ? t('family.joinPage.until', { date: formatDate(preview.expiresAt) })
            : t('auth.invite.until', { date: formatDate(preview.expiresAt) })}
        </p>
      </div>
    </div>
  );
}

export function InviteChecking() {
  const { t } = useTranslation();

  return (
    <p className={invite.checking} role="status">
      <Loader size={18} color="currentColor" aria-hidden="true" />
      {t('auth.invite.checking')}
    </p>
  );
}

export function InviteCheckFailed({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <div role="alert">
      <p className={invite.text}>{t('auth.invite.failed')}</p>
      <Button variant="quiet" className={invite.action} onClick={onRetry}>
        {t('auth.invite.retry')}
      </Button>
    </div>
  );
}

/**
 * A used, expired, cancelled or made-up link: it never says which, or who made it. Someone signed in goes on to
 * Family instead of signing in.
 */
export function InvitationGone({ signedIn = false }: { signedIn?: boolean }) {
  const { t } = useTranslation();

  return (
    <>
      <h1 className={invite.goneTitle}>{t('auth.invite.goneTitle')}</h1>
      <p className={invite.text}>{t('auth.invite.goneText')}</p>
      <Button
        component={Link}
        to={signedIn ? '/family' : '/sign-in'}
        fullWidth
        className={cx(classes.button, invite.action)}
      >
        {signedIn ? t('family.joinPage.goToFamily') : t('auth.signIn')}
      </Button>
      {!signedIn && <p className={invite.foot}>{t('auth.invite.goneHint')}</p>}
    </>
  );
}

/** Create account while sign-up is invite-only: how to get a link instead of a form nobody can use. */
export function InviteOnlyNotice() {
  const { t } = useTranslation();

  return (
    <div className={invite.notice}>
      <span className={invite.noticeIcon}>
        <IconLock size={20} stroke={1.7} aria-hidden="true" />
      </span>
      <h2 className={invite.title}>{t('auth.inviteOnly.title')}</h2>
      <p className={invite.text}>{t('auth.inviteOnly.text')}</p>
      <p className={invite.text}>{t('auth.inviteOnly.haveAccount')}</p>
      <Button
        component={Link}
        to="/sign-in"
        replace
        variant="default"
        fullWidth
        className={cx(classes.button, classes.google, invite.action)}
      >
        {t('auth.inviteOnly.goToSignIn')}
      </Button>
    </div>
  );
}
