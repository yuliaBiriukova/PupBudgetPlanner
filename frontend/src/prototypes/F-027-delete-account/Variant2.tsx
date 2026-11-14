import { Button } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { AdminLine, ComingBack, FamilyPart, ProofPart, WhatGoes, WordPart } from './DeleteParts';
import { useDeleteFlow } from './deleteFlow';
import { DeleteSection } from './ProtoSettings';
import classes from './DeleteAccount.module.css';

/**
 * Variant 2 "In place": nothing pops up. What goes is on the page from the start; Delete account unfolds the steps
 * right in the section, numbered, with the red button at their end.
 */
export function Variant2Section() {
  const flow = useDeleteFlow();
  const [open, setOpen] = useState(false);
  const stepsRef = useRef<HTMLDivElement>(null);
  // The steps are numbered from the family's, when there is one
  const first = flow.family === 'none' ? 0 : 1;

  return (
    <DeleteSection text="Deletes everything you keep in Pup, for good.">
      {flow.who === 'admin' ? (
        <AdminLine />
      ) : (
        <>
          <WhatGoes />
          {open ? (
            <div
              ref={stepsRef}
              className={classes.steps}
              tabIndex={-1}
              aria-label="Delete your account"
            >
              {flow.family !== 'none' && <FamilyPart flow={flow} number={1} />}
              <ProofPart flow={flow} number={first + 1} />
              <WordPart flow={flow} number={first + 2} />
              <ComingBack />
              <div className={classes.stepButtons}>
                <Button
                  variant="quiet"
                  onClick={() => {
                    setOpen(false);
                    flow.reset();
                  }}
                >
                  Keep my account
                </Button>
                <Button variant="danger" loading={flow.pending} onClick={flow.submit}>
                  Delete for good
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Button
                variant="danger-quiet"
                className={classes.startButton}
                leftSection={<IconTrash size={20} stroke={1.7} aria-hidden />}
                onClick={() => {
                  setOpen(true);
                  requestAnimationFrame(() => stepsRef.current?.focus());
                }}
              >
                Delete account
              </Button>
            </div>
          )}
        </>
      )}
    </DeleteSection>
  );
}
