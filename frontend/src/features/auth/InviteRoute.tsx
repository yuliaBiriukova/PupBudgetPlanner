import { notifications } from '@mantine/notifications';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router';
import { JoinFamilyPage } from '../family/JoinFamilyPage';
import { currentUserQuery, invitationPreviewQuery } from './authApi';
import { AuthLayout } from './AuthLayout';
import { InvitePage } from './InvitePage';

/**
 * `/invite/:token`: the auth frame without the Sign in / Create account switch. Someone who creates their account here
 * goes on into the app: to Family for a family's link, which their account has joined (F-023). Someone already signed
 * in who opens a family's link is asked to join it; with the admin's link they go on into the app, as before (F-028).
 */
export function InviteRoute() {
  const { token = '' } = useParams();
  const user = useQuery(currentUserQuery);
  const queryClient = useQueryClient();
  // Signed out here at first: becoming signed in means the account was just created with this link
  const [signedOutHere, setSignedOutHere] = useState(false);
  if (user.data === null && !signedOutHere) setSignedOutHere(true);

  if (user.data && signedOutHere) {
    const preview = queryClient.getQueryData(invitationPreviewQuery(token).queryKey);
    return <SignedUp familyName={preview?.family?.name} />;
  }
  return (
    <AuthLayout withSwitch={false}>
      {user.data ? (
        <JoinFamilyPage token={token} email={user.data.email} />
      ) : (
        <InvitePage token={token} />
      )}
    </AuthLayout>
  );
}

/** The account was created with the link: into the app, or to the family it joined. */
function SignedUp({ familyName }: { familyName: string | undefined }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!familyName) return;
    // One id, so a second run of the effect doesn't show it twice
    notifications.show({
      id: 'joined-family',
      message: t('family.joinPage.joined', { family: familyName }),
    });
  }, [familyName, t]);

  return <Navigate to={familyName ? '/family' : '/transactions'} replace />;
}
