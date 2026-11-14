import { Button, Title } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router';
import settings from '../../features/settings/Settings.module.css';
import { AdminLine, ComingBack, FamilyPart, ProofPart, WhatGoes, WordPart } from './DeleteParts';
import { useDeleteFlow, useDeleteSetup } from './deleteFlow';
import { DeleteSection } from './ProtoSettings';
import classes from './DeleteAccount.module.css';

export const DELETE_PAGE = '/settings/delete-account';

/** Variant 3's section: a row that opens a page of its own. */
export function Variant3Section() {
  const { who } = useDeleteSetup();
  return (
    <DeleteSection text="See what goes before you decide; nothing is deleted until you confirm.">
      {who === 'admin' ? (
        <AdminLine />
      ) : (
        <Link to={DELETE_PAGE} className={classes.openRow}>
          <span>Delete account</span>
          <IconChevronRight size={20} stroke={1.7} aria-hidden />
        </Link>
      )}
    </DeleteSection>
  );
}

/**
 * Variant 3 "The last page": a page of its own, like the last page of the household book. Your money by currency and
 * the counts on top, set as figures; then the family, the proof and the word, and the red button at the end.
 */
export function DeletePage() {
  const flow = useDeleteFlow();
  const navigate = useNavigate();

  return (
    <div className={classes.page}>
      <Link to="/settings" className={classes.back}>
        <IconChevronLeft size={20} stroke={1.7} aria-hidden />
        Settings
      </Link>
      <header className={settings.head}>
        <Title order={1}>Delete your account</Title>
        <p className={classes.pageLead}>
          Everything below goes for good the moment you confirm. It can’t be undone.
        </p>
      </header>
      <section className={classes.pageBlock} aria-labelledby="what-goes">
        <h2 id="what-goes" className={classes.blockTitle}>
          What goes
        </h2>
        <WhatGoes withMoney />
      </section>
      <section className={classes.pageBlock} aria-labelledby="confirm">
        <h2 id="confirm" className={classes.blockTitle}>
          Confirm
        </h2>
        <div className={classes.confirmParts}>
          <FamilyPart flow={flow} />
          <ProofPart flow={flow} />
          <WordPart flow={flow} />
          <ComingBack />
          <div className={classes.pageButtons}>
            <Button
              variant="quiet"
              onClick={() => {
                void navigate('/settings');
              }}
            >
              Keep my account
            </Button>
            <Button variant="danger" loading={flow.pending} onClick={flow.submit}>
              Delete my account for good
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
