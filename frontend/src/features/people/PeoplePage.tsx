import { Button, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router';
import { NotFoundPage } from '../../app/NotFoundPage';
import { currentUserQuery } from '../auth/authApi';
import { LinksTab } from './LinksTab';
import classes from './People.module.css';
import { NewLinkDialog } from './PeopleDialogs';
import { invitationsQuery, peopleQuery } from './peopleApi';
import { PeopleTab } from './PeopleTab';

/**
 * The admin's People page (F-028): New invite link, then two tabs with their own addresses, `/people` and
 * `/people/links`. Anyone else gets "Page not found", as if it weren't there.
 */
export function PeoplePage({ tab }: { tab: 'people' | 'links' }) {
  const { t } = useTranslation();
  const { data: user } = useQuery(currentUserQuery);
  const navigate = useNavigate();
  const [newLinkOpened, newLink] = useDisclosure(false);
  const isAdmin = user?.isAdmin === true;
  const people = useQuery({ ...peopleQuery, enabled: isAdmin });
  const invitations = useQuery({ ...invitationsQuery, enabled: isAdmin });

  if (!isAdmin) return <NotFoundPage />;

  const waiting = invitations.data?.filter((i) => i.status === 'Waiting').length;

  return (
    <>
      <header className={classes.head}>
        <Title order={1} className={classes.title}>
          {t('nav.people')}
        </Title>
        <Button
          radius="xl"
          className={classes.newButton}
          leftSection={<IconPlus size={20} stroke={1.8} />}
          onClick={newLink.open}
        >
          {t('people.newLink.button')}
        </Button>
      </header>
      <nav className={classes.tabs} aria-label={t('people.tabsLabel')}>
        <NavLink to="/people" end className={classes.tab}>
          {t('people.tabs.people')}{' '}
          {people.data && <span className={classes.count}>{people.data.length}</span>}
        </NavLink>
        <NavLink to="/people/links" className={classes.tab}>
          {t('people.tabs.links')}{' '}
          {waiting !== undefined && <span className={classes.count}>{waiting}</span>}
        </NavLink>
      </nav>
      {tab === 'people' ? <PeopleTab /> : <LinksTab />}
      <NewLinkDialog
        opened={newLinkOpened}
        onClose={newLink.close}
        onDone={() => {
          void navigate('/people/links');
        }}
      />
    </>
  );
}
