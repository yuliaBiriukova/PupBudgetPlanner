import { Button } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import {
  AdminLine,
  ComingBack,
  FamilyPart,
  ProofPart,
  WhatGoes,
  WhatGoesText,
  WordPart,
} from './DeleteParts';
import { useDeleteFlow } from './deleteFlow';
import { DeleteSection } from './ProtoSettings';
import classes from './DeleteAccount.module.css';

/**
 * Variant 1 "One dialog"; the final prototype (`asText`) says what goes in a grey line instead of the table.
 *
 * Variant 1 "One dialog": the last section of Settings has a red word button; everything is asked in one pop-up
 * (a sheet on the phone): what goes, the family, the password or Google, the word.
 */
export function Variant1Section({ asText = false }: { asText?: boolean }) {
  const flow = useDeleteFlow();
  const [opened, setOpened] = useState(false);
  const close = () => {
    setOpened(false);
    flow.reset();
  };

  return (
    <DeleteSection text="Deletes your accounts, transactions and categories for good.">
      {flow.who === 'admin' ? (
        <AdminLine />
      ) : (
        <div>
          <Button
            variant="danger-quiet"
            className={classes.startButton}
            leftSection={<IconTrash size={20} stroke={1.7} aria-hidden />}
            onClick={() => {
              setOpened(true);
            }}
          >
            Delete account
          </Button>
        </div>
      )}
      <ResponsiveDialog
        opened={opened}
        onClose={close}
        title="Delete your account?"
        footer={
          <>
            <Button variant="quiet" onClick={close}>
              Keep my account
            </Button>
            <Button variant="danger" loading={flow.pending} onClick={flow.submit}>
              Delete for good
            </Button>
          </>
        }
      >
        <div className={classes.dialogBody}>
          {asText ? (
            <div className={classes.summary}>
              <p className={classes.lead}>This deletes everything you keep in Pup:</p>
              <WhatGoesText />
            </div>
          ) : (
            <>
              <p className={classes.lead}>This deletes everything you keep in Pup:</p>
              <WhatGoes />
            </>
          )}
          <FamilyPart flow={flow} />
          <ProofPart flow={flow} />
          <WordPart flow={flow} />
          <ComingBack />
        </div>
      </ResponsiveDialog>
    </DeleteSection>
  );
}
