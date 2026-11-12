import { UnstyledButton, VisuallyHidden } from '@mantine/core';
import { IconCheck, IconChevronDown, IconEye } from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '../../shared/ui/cx';
import { Picker } from '../transactions/Picker';
import formClasses from '../transactions/TransactionForm.module.css';
import type { FamilyMember } from './familyApi';
import classes from './Whose.module.css';
import { FAMILY, initialOf, ME, useWhose, type Who } from './whose';

/** Everyone's choices in order: you, the others, the family. */
function choicesOf(people: FamilyMember[]): Who[] {
  return [ME, ...people.filter((member) => !member.isYou).map((member) => member.id), FAMILY];
}

/** A person's initial in a small circle (the People and Family pages' grey circle); the family's overlapping. */
export function Initial({
  who,
  people,
  size = 'md',
}: {
  who: Who;
  people: FamilyMember[];
  size?: 'sm' | 'md';
}) {
  if (who === FAMILY)
    return (
      <span className={classes.stack} data-size={size} aria-hidden="true">
        {people.slice(0, 3).map((member) => (
          <span key={member.id} className={classes.initial} data-size={size}>
            {initialOf(member.displayName)}
          </span>
        ))}
      </span>
    );
  const person =
    who === ME ? people.find((member) => member.isYou) : people.find((member) => member.id === who);
  return (
    <span className={classes.initial} data-size={size} aria-hidden="true">
      {initialOf(person?.displayName ?? '')}
    </span>
  );
}

/** The choice's short name: Me, Andriy, Family (the lens itself says Mine). */
function useChoiceName() {
  const { t } = useTranslation();
  return (who: Who, people: FamilyMember[]) =>
    who === ME
      ? t('whose.me')
      : who === FAMILY
        ? t('whose.family')
        : (people.find((member) => member.id === who)?.displayName ?? '');
}

/** The list the lens opens: you, each member, the family, the picked one ticked. */
function WhoList({
  who,
  people,
  onPick,
}: {
  who: Who;
  people: FamilyMember[];
  onPick: (who: Who) => void;
}) {
  const { t } = useTranslation();
  const nameOf = useChoiceName();
  return (
    <ul className={formClasses.list}>
      {choicesOf(people).map((choice) => (
        <li key={choice}>
          <UnstyledButton
            className={cx(formClasses.listItem, classes.whoItem)}
            aria-pressed={choice === who}
            data-autofocus={choice === who || undefined}
            onClick={() => {
              onPick(choice);
            }}
          >
            <span
              className={classes.slot}
              // As wide as the family's initials (28 px, each next one 22 px more) and an 8 px gap
              style={{ width: 28 + (Math.min(people.length, 3) - 1) * 22 + 8 }}
            >
              <Initial who={choice} people={people} />
            </span>
            <span className={classes.whoItemText}>
              <span className={formClasses.listName}>{nameOf(choice, people)}</span>
              <span className={classes.whoItemSub}>
                {t(
                  choice === ME
                    ? 'whose.meHint'
                    : choice === FAMILY
                      ? 'whose.familyHint'
                      : 'whose.memberHint',
                )}
              </span>
            </span>
            {choice === who && <IconCheck size={20} stroke={1.7} className={classes.tick} />}
          </UnstyledButton>
        </li>
      ))}
    </ul>
  );
}

/**
 * The lens (F-024): one choice of whose money for the whole app. In the sidebar a row under Add (in the rail only the
 * initial); on the phone a pill in the top bar. Both open the same list: a dropdown, a sheet on the phone. Nothing
 * without a family.
 */
export function WhoseLens({
  place,
  collapsed = false,
}: {
  place: 'sidebar' | 'top';
  collapsed?: boolean;
}) {
  const { t } = useTranslation();
  const { who, setWho, people, lens } = useWhose();
  const nameOf = useChoiceName();
  const [open, setOpen] = useState(false);
  if (!lens) return null;
  const name = who === ME ? t('whose.mine') : nameOf(who, people);

  return (
    <Picker
      opened={open}
      onClose={() => {
        setOpen(false);
      }}
      title={t('whose.lens')}
      width={place === 'sidebar' ? 'target' : 260}
      position={place === 'sidebar' ? 'bottom-start' : 'bottom'}
      listHeight={344}
      target={
        <UnstyledButton
          className={place === 'sidebar' ? classes.lensRow : classes.lensPill}
          data-collapsed={collapsed || undefined}
          data-on={who !== ME || undefined}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setOpen(!open);
          }}
        >
          <Initial who={who} people={people} size={place === 'top' ? 'sm' : 'md'} />
          {/* In the rail only the initial shows: the name is said (its own text, not an aria-label the
              initials would have to match) */}
          {collapsed && <VisuallyHidden>{t('whose.lensNamed', { name })}</VisuallyHidden>}
          {!collapsed && (
            <span className={classes.lensText}>
              {place === 'sidebar' ? (
                <span className={classes.lensLabel}>{t('whose.lens')}</span>
              ) : (
                <VisuallyHidden>{t('whose.lens')}: </VisuallyHidden>
              )}
              <span className={classes.lensName}>{name}</span>
            </span>
          )}
          {!collapsed && <IconChevronDown size={16} stroke={1.7} aria-hidden />}
        </UnstyledButton>
      }
    >
      <WhoList
        who={who}
        people={people}
        onPick={(next) => {
          setOpen(false);
          setWho(next);
        }}
      />
    </Picker>
  );
}

/**
 * Over the page, when the money isn't only yours: whose it is, what you can do with it, and a way back to your own
 * (the lens is away from the page). `children` adds a line of the page's own.
 */
export function WhoseBand({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  const { who, setWho, person, lens } = useWhose();
  if (!lens || who === ME) return null;
  return (
    <p className={classes.whoseLine}>
      <IconEye size={16} stroke={1.7} aria-hidden className={classes.whoseIcon} />
      <span className={classes.whoseText}>
        <strong>
          {person ? t('whose.theirMoney', { name: person.displayName }) : t('whose.familyMoney')}
        </strong>{' '}
        {person
          ? t('whose.onlyTheyChange', { name: person.displayName })
          : t('whose.youChangeYours')}
        {children && <> {children}</>}
      </span>
      <UnstyledButton
        className={classes.backToMine}
        onClick={() => {
          setWho(ME);
        }}
      >
        {t('whose.backToMine')}
      </UnstyledButton>
    </p>
  );
}

/** Whose a line is, in the family's receipts: the member's initial before the category, and their name said. */
export function LineWhose({ name }: { name: string }) {
  const { t } = useTranslation();
  return (
    <span className={classes.lineWhose}>
      <span className={classes.initial} data-size="sm" aria-hidden="true">
        {initialOf(name)}
      </span>
      <VisuallyHidden>{t('whose.theirsLine', { name })}</VisuallyHidden>{' '}
    </span>
  );
}
