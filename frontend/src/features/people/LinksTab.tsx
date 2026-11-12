import { useTranslation } from 'react-i18next';
import { InviteLinks } from './InviteLinks';
import classes from './People.module.css';

/** People › Invite links: every link, the admin's and families' (F-028); picked ones are cancelled or deleted (I-006). */
export function LinksTab() {
  const { t } = useTranslation();

  return (
    <>
      <p className={classes.lead}>{t('people.links.lead')}</p>
      <InviteLinks place="admin" />
    </>
  );
}
