import { Button, UnstyledButton } from '@mantine/core';
import { IconCheck, IconCoins, IconEye, IconEyeOff, IconLock, IconX } from '@tabler/icons-react';
import type { CategoryGroup } from '../../features/categories/categoriesApi';
import tags from '../../features/categories/Categories.module.css';
import { cx } from '../../shared/ui/cx';
import pills from '../../shared/ui/Pills.module.css';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import classes from './FamilyPrivacy.module.css';
import { useOwnMoney } from './ownMoney';
import { LINES, usePrivacy, type Level } from './privacy';

export function LevelIcon({ level, size = 20 }: { level: Level; size?: number }) {
  const Icon = level === 'Hidden' ? IconEyeOff : level === 'BalanceOnly' ? IconCoins : IconEye;
  return <Icon size={size} stroke={1.7} aria-hidden />;
}

/** Every transaction or only the totals: two rows to pick from, each with a line on what it means. */
export function LinesChoice({ label, plain }: { label: string; plain?: boolean }) {
  const { privacy, setLines } = usePrivacy();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={classes.choiceRows}
      data-plain={plain === true ? true : undefined}
    >
      {LINES.map((item) => {
        const checked = privacy.lines === item.value;
        return (
          <UnstyledButton
            key={item.value}
            role="radio"
            aria-checked={checked}
            className={classes.choiceRow}
            onClick={() => {
              setLines(item.value);
            }}
          >
            <span className={classes.radioDot} aria-hidden="true">
              {checked && <IconCheck size={14} stroke={2.4} />}
            </span>
            <span>
              <span className={classes.choiceTitle}>{item.label}</span>
              <span className={classes.choiceText}>{item.text}</span>
            </span>
          </UnstyledButton>
        );
      })}
    </div>
  );
}

/** The private categories as tags, each with an × that shares it again. */
export function PrivateTags({ groups }: { groups: CategoryGroup[] }) {
  const { privacy, setCategory } = usePrivacy();
  const kept = groups.flatMap((group) =>
    group.categories
      .filter((category) => privacy.categories.includes(category.id))
      .map((category) => ({ ...category, group: group.name })),
  );
  if (kept.length === 0) return null;
  return (
    <ul className={tags.tags}>
      {kept.map((category) => (
        <li key={category.id}>
          <span className={cx(tags.tag, classes.privateTag)}>
            <IconLock size={16} stroke={1.7} aria-hidden />
            {category.name}
            <span className={classes.tagGroup}>{category.group}</span>
            <UnstyledButton
              className={classes.tagX}
              aria-label={`Share ${category.name} (${category.group}) again`}
              onClick={() => {
                setCategory(category.id, false);
              }}
            >
              <IconX size={16} stroke={1.7} aria-hidden />
            </UnstyledButton>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Every category by group as pills: a picked one is private, with a lock. */
export function CategoriesDialog({
  opened,
  onClose,
  seers,
}: {
  opened: boolean;
  onClose: () => void;
  seers: string;
}) {
  const { privacy, setCategory } = usePrivacy();
  const { groups } = useOwnMoney();
  return (
    <ResponsiveDialog
      opened={opened}
      onClose={onClose}
      title="Private categories"
      size={560}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <p className={classes.dialogLead}>
        {seers} won’t see a private category, its transactions or its total.
      </p>
      {groups.map((group) => (
        <section key={group.id} className={classes.pickGroup}>
          <h3 className={classes.pickGroupName}>{group.name}</h3>
          <div className={pills.pills}>
            {group.categories
              .filter((category) => !category.isHidden)
              .map((category) => {
                const on = privacy.categories.includes(category.id);
                return (
                  <UnstyledButton
                    key={category.id}
                    className={pills.pill}
                    aria-pressed={on}
                    onClick={() => {
                      setCategory(category.id, !on);
                    }}
                  >
                    {on && <IconLock size={16} stroke={1.7} aria-hidden />}
                    {category.name}
                  </UnstyledButton>
                );
              })}
          </div>
        </section>
      ))}
    </ResponsiveDialog>
  );
}
