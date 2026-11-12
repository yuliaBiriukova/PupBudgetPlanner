// I-032 prototype: a copy of features/people/LinksTab.tsx with the prototype's list.
import { useTranslation } from 'react-i18next';
import classes from '../../features/people/People.module.css';
import { InviteLinks } from './ProtoInviteLinks';

/** People › Invite links: every link in one list, its status on each row (I-032). */
export function ProtoLinksTab() {
  const { t } = useTranslation();

  return (
    <>
      <p className={classes.lead}>{t('people.links.lead')}</p>
      <InviteLinks place="admin" />
    </>
  );
}
