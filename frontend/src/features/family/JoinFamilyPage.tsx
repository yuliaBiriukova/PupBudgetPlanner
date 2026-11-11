import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router';
import { formatDate } from '../../shared/format/date';
import { cx } from '../../shared/ui/cx';
import { InvitationGoneError, invitationPreviewQuery, useSignOut } from '../auth/authApi';
import auth from '../auth/AuthForm.module.css';
import invite from '../auth/Invite.module.css';
import { InvitationGone, InviteCheckFailed, InviteChecking, Invited } from '../auth/InvitePage';
import classes from './Family.module.css';
import { FamilyError, familyQuery, initialsOf, useJoinFamily } from './familyApi';
import { WhatItMeans } from './FamilyParts';

interface JoinFamilyPageProps {
  token: string;
  /** The signed-in person's email: "Signed in as …". */
  email: string;
}

/**
 * A family's link opened by someone signed in (F-023): who invites you to which family, its members and what joining
 * means, then Join family. Someone already in a family is told to leave it first. The admin's links only create
 * accounts: a signed-in person goes on into the app, as before (F-028).
 */
export function JoinFamilyPage({ token, email }: JoinFamilyPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Asked again on every visit: the link may have been used meanwhile, by this person signing up with it too
  const preview = useQuery({ ...invitationPreviewQuery(token), refetchOnMount: 'always' });
  const family = useQuery(familyQuery);
  const join = useJoinFamily();

  if (preview.error instanceof InvitationGoneError) {
    // Most likely this person's own account was just created with it, and the family is theirs now
    if (family.data) return <Navigate to="/family" replace />;
    if (family.isPending) return <InviteChecking />;
    return <InvitationGone signedIn />;
  }
  if (preview.isError || family.isError) {
    return (
      <InviteCheckFailed
        onRetry={() => {
          void preview.refetch();
          void family.refetch();
        }}
      />
    );
  }
  if (!preview.isFetchedAfterMount || preview.isPending || family.isPending) {
    return <InviteChecking />;
  }

  const invitedTo = preview.data.family;
  if (!invitedTo) return <Navigate to="/transactions" replace />;
  const until = formatDate(preview.data.expiresAt);

  const goToFamily = (
    <Button component={Link} to="/family" fullWidth className={cx(auth.button, invite.action)}>
      {t('family.joinPage.goToFamily')}
    </Button>
  );

  if (family.data) {
    const same = family.data.id === invitedTo.id;
    return (
      <>
        <Invited preview={preview.data} />
        <h1 className={cx(invite.goneTitle, classes.joinTitle)}>
          {same
            ? t('family.joinPage.sameTitle', { family: invitedTo.name })
            : t('family.joinPage.alreadyTitle')}
        </h1>
        <p className={invite.text}>
          {same
            ? t('family.joinPage.sameText', { date: until })
            : t('family.joinPage.alreadyText', {
                current: family.data.name,
                family: invitedTo.name,
                date: until,
              })}
        </p>
        {goToFamily}
        <SignedInAs email={email} />
      </>
    );
  }

  return (
    <>
      <Invited preview={preview.data} />
      <h1 className={cx(invite.goneTitle, classes.joinTitle)}>
        {t('family.joinPage.title', { family: invitedTo.name })}
      </h1>
      <ul className={classes.joinWho} aria-label={t('family.joinPage.inFamily')}>
        {invitedTo.members.map((m, i) => (
          <li key={`${m.displayName}-${String(i)}`}>
            <span className={classes.initialsSmall} aria-hidden="true">
              {initialsOf(m.displayName)}
            </span>
            {m.displayName}
            {m.isOwner && <span className={classes.quiet}>{t('family.joinPage.owner')}</span>}
          </li>
        ))}
      </ul>
      <WhatItMeans className={classes.meansJoin} />
      <Button
        fullWidth
        className={cx(auth.button, invite.action)}
        loading={join.isPending}
        onClick={() => {
          join.mutate(token, {
            onSuccess: () => {
              notifications.show({
                message: t('family.joinPage.joined', { family: invitedTo.name }),
              });
              void navigate('/family', { replace: true });
            },
            onError: (error) => {
              // Gone or already in a family: the page shows which once it has asked again
              if (error instanceof FamilyError && error.failure !== 'unknown') {
                void preview.refetch();
                return;
              }
              notifications.show({ color: 'red', message: t('family.failed') });
            },
          });
        }}
      >
        {t('family.joinPage.join')}
      </Button>
      <Button component={Link} to="/transactions" variant="quiet" fullWidth mt={8}>
        {t('family.joinPage.notNow')}
      </Button>
      <SignedInAs email={email} />
    </>
  );
}

/** "Signed in as …. Not you?": signing out shows the link to someone without an account. */
function SignedInAs({ email }: { email: string }) {
  const { t } = useTranslation();
  const signOut = useSignOut();

  return (
    <p className={invite.foot}>
      {t('family.joinPage.signedInAs', { email })}{' '}
      <button
        type="button"
        className={cx(invite.footLink, classes.linkButton)}
        onClick={() => {
          signOut.mutate();
        }}
      >
        {t('family.joinPage.notYou')}
      </button>
    </p>
  );
}
