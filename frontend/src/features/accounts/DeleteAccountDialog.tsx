import { useState } from 'react';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import type { Account } from './accountsApi';
import { useDeleteQuestion } from './useDeleteQuestion';

/** Delete from Archived: the same question in a dialog of its own. */
export function DeleteAccountDialog({
  account,
  onClose,
  onDeleted,
}: {
  account: Account | undefined;
  onClose: () => void;
  onDeleted: (account: Account) => void;
}) {
  // The last account asked about stays in the dialog while it closes, so its title doesn't empty on the way out
  const [shown, setShown] = useState(account);
  if (account && account !== shown) setShown(account);
  const question = useDeleteQuestion(shown, { onKeep: onClose, onDeleted });

  return (
    <ResponsiveDialog
      opened={account !== undefined}
      onClose={question.keep}
      title={question.title}
      footer={question.footer}
    >
      {question.children}
    </ResponsiveDialog>
  );
}
