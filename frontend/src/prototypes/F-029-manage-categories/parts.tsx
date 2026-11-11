import { Button } from '@mantine/core';
import { IconEye, IconEyeOff, IconInfoCircle } from '@tabler/icons-react';
import type { ProtoCategory, ProtoGroup } from './protoData';
import classes from './Proto.module.css';
import { groupRemoval, kindWord, removeOutcome } from './useCategoryEdits';

/** A hidden group: lower contrast, eye-off, Show brings it back. */
export function HiddenRow({
  name,
  label = 'Hidden',
  onShow,
}: {
  name: string;
  label?: string;
  onShow: () => void;
}) {
  return (
    <li className={classes.hiddenRow}>
      <IconEyeOff size={20} stroke={1.7} aria-hidden />
      <span className={classes.name}>{name}</span>
      <span className={classes.hiddenLabel}>{label}</span>
      <Button
        variant="quiet"
        leftSection={<IconEye size={20} stroke={1.7} />}
        onClick={onShow}
        aria-label={`Show ${name} again`}
      >
        Show
      </Button>
    </li>
  );
}

const plural = (n: number, one: string, many: string) => `${String(n)} ${n === 1 ? one : many}`;

/** The words that say what removing a category does, before it is confirmed. */
export function RemoveCategoryText({ category }: { category: ProtoCategory }) {
  if (removeOutcome(category) === 'delete')
    return (
      <p className={classes.dialogText}>
        It has no transactions, so it’s deleted for good. You can add it again later.
      </p>
    );
  return (
    <>
      <p className={classes.dialogText}>
        It has {plural(category.used, 'transaction', 'transactions')}, so it’s hidden, not deleted.
      </p>
      <div className={classes.facts}>
        <IconInfoCircle size={20} stroke={1.7} aria-hidden />
        <p>
          You won’t see it when you add a transaction. Its transactions keep it, and the reports and
          the Transactions filters still show it. You can show it again here.
        </p>
      </div>
    </>
  );
}

/** The words for removing a group: what happens, or why it can't go yet. */
export function RemoveGroupText({ group, groups }: { group: ProtoGroup; groups: ProtoGroup[] }) {
  const removal = groupRemoval(group, groups);
  if ('cannot' in removal)
    return (
      <p className={classes.dialogText}>
        {removal.cannot === 'last'
          ? `It’s your only ${kindWord(group.kind)} group, so it stays. Add another one first.`
          : `It still has ${plural(removal.shown, 'category', 'categories')}. Move them to another group or remove them first.`}
      </p>
    );
  return (
    <p className={classes.dialogText}>
      {removal.can === 'delete'
        ? 'It has no categories, so it’s deleted for good.'
        : 'It holds only hidden categories, so it’s hidden with them. Their transactions keep them.'}
    </p>
  );
}
