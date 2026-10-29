import { Button, Loader } from '@mantine/core';
import { IconLock, IconTicket } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { cx } from '../../shared/ui/cx';
import { Link, useParams } from 'react-router';
import { formatDate } from '../../shared/format/date';
import { AuthError, InvitationGoneError, invitationPreviewQuery, useRegister } from './authApi';
import classes from './AuthForm.module.css';
import invite from './Invite.module.css';
import { SignUpForm } from './SignUpForm';
import { useWakeNote } from './useWakeNote';

/**
 * `/invite/:token` (F-028): who invited and until when, then Create account and Continue with Google with the
 * link's token. A link that doesn't work gets one neutral page.
 */
export function InvitePage() {
  const { t } = useTranslation();
  const { token = '' } = useParams();
  const preview = useQuery(invitationPreviewQuery(token));
  const register = useRegister();
  const notice = useWakeNote();

  if (preview.isPending) {
    return (
      <p className={invite.checking} role="status">
        <Loader size={18} color="currentColor" aria-hidden="true" />
        {t('auth.invite.checking')}
      </p>
    );
  }
  if (preview.error instanceof InvitationGoneError) return <InvitationGone />;
  if (preview.isError) {
    return (
      <div role="alert">
        <p className={invite.text}>{t('auth.invite.failed')}</p>
        <Button
          variant="default"
          className={invite.action}
          onClick={() => {
            void preview.refetch();
          }}
        >
          {t('auth.invite.retry')}
        </Button>
      </div>
    );
  }

  const failure =
    register.error instanceof AuthError
      ? register.error.failure
      : register.error
        ? 'unknown'
        : null;
  return (
    <>
      <div className={invite.invited}>
        <IconTicket className={invite.invitedIcon} size={20} stroke={1.7} aria-hidden="true" />
        <div>
          <p className={invite.invitedTitle}>
            {t('auth.invite.invited', { name: preview.data.inviterName })}
          </p>
          <p className={invite.invitedText}>
            {t('auth.invite.until', { date: formatDate(preview.data.expiresAt) })}
          </p>
        </div>
      </div>
      <SignUpForm
        inviteToken={token}
        onSubmit={(values) => {
          register.mutate(values);
        }}
        pending={register.isPending}
        failure={failure}
        notice={notice}
      />
      <p className={invite.foot}>
        {t('auth.invite.haveAccount')}{' '}
        <Link to="/sign-in" className={invite.footLink}>
          {t('auth.signIn')}
        </Link>
      </p>
    </>
  );
}

/** A used, expired, cancelled or made-up link: it never says which, or who made it. */
export function InvitationGone() {
  const { t } = useTranslation();

  return (
    <>
      <h1 className={invite.goneTitle}>{t('auth.invite.goneTitle')}</h1>
      <p className={invite.text}>{t('auth.invite.goneText')}</p>
      <Button
        component={Link}
        to="/sign-in"
        fullWidth
        className={cx(classes.button, invite.action)}
      >
        {t('auth.signIn')}
      </Button>
      <p className={invite.foot}>{t('auth.invite.goneHint')}</p>
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
