import { UnstyledButton, VisuallyHidden } from '@mantine/core';
import { IconCheck, IconChevronDown, IconEye } from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';
import { Picker } from '../../features/transactions/Picker';
import formClasses from '../../features/transactions/TransactionForm.module.css';
import { cx } from '../../shared/ui/cx';
import classes from './FamilyViews.module.css';
import { initialOf, whoName, whoseMoney } from './who';
import type { Person, Who } from './world';

/** Everyone's choices in order: you, the others, the family. */
function choicesOf(people: Person[]): Who[] {
  return ['me', ...people.filter((person) => !person.isYou).map((person) => person.id), 'family'];
}

/** A person's initial in a small circle; the family as the members' initials overlapping. */
export function Initial({
  who,
  people,
  size = 'md',
}: {
  who: Who;
  people: Person[];
  size?: 'sm' | 'md';
}) {
  if (who === 'family')
    return (
      <span className={classes.stack} data-size={size} aria-hidden="true">
        {people.slice(0, 3).map((person) => (
          <span key={person.id} className={classes.initial} data-size={size}>
            {person.name.slice(0, 1)}
          </span>
        ))}
      </span>
    );
  return (
    <span className={classes.initial} data-size={size} aria-hidden="true">
      {initialOf(who, people)}
    </span>
  );
}

/** The list the switchers open: you, each member, the family, the picked one ticked. */
function WhoList({
  who,
  people,
  onPick,
}: {
  who: Who;
  people: Person[];
  onPick: (who: Who) => void;
}) {
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
              <span className={formClasses.listName}>
                {choice === 'me' ? 'Me' : whoName(choice, people)}
              </span>
              <span className={classes.whoItemSub}>
                {choice === 'me'
                  ? 'Your own money'
                  : choice === 'family'
                    ? 'Everyone together'
                    : 'Only to look at'}
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
 * The lens: one choice of whose money for the whole app. In the sidebar a row under Add (in the rail only
 * the initial); on the phone a pill in the top bar. Both open the same list (a dropdown, a sheet on the phone).
 */
export function Lens({
  who,
  people,
  onPick,
  place,
  collapsed = false,
}: {
  who: Who;
  people: Person[];
  onPick: (who: Who) => void;
  place: 'sidebar' | 'top';
  collapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const name = whoName(who, people);
  return (
    <Picker
      opened={open}
      onClose={() => {
        setOpen(false);
      }}
      title="Whose money"
      width={place === 'sidebar' ? 'target' : 260}
      position={place === 'sidebar' ? 'bottom-start' : 'bottom'}
      listHeight={344}
      target={
        <UnstyledButton
          className={place === 'sidebar' ? classes.lensRow : classes.lensPill}
          data-collapsed={collapsed || undefined}
          // In the rail only the initial shows: the name is said
          aria-label={collapsed ? `Whose money: ${who === 'me' ? 'Mine' : name}` : undefined}
          data-on={who !== 'me' || undefined}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setOpen(!open);
          }}
        >
          <Initial who={who} people={people} size={place === 'top' ? 'sm' : 'md'} />
          {!collapsed && (
            <span className={classes.lensText}>
              {place === 'sidebar' ? (
                <span className={classes.lensLabel}>Whose money</span>
              ) : (
                <VisuallyHidden>Whose money: </VisuallyHidden>
              )}
              <span className={classes.lensName}>{who === 'me' ? 'Mine' : name}</span>
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
          onPick(next);
        }}
      />
    </Picker>
  );
}

/**
 * Over the page, when the money isn't only yours: whose it is, what you can do with it, and a way back to your own
 * (the lens is away from the page).
 */
export function WhoseLine({
  who,
  people,
  onMine,
  children,
}: {
  who: Who;
  people: Person[];
  onMine?: () => void;
  children?: ReactNode;
}) {
  if (who === 'me') return null;
  const name = whoName(who, people);
  return (
    <p className={classes.whoseLine}>
      <IconEye size={16} stroke={1.7} aria-hidden className={classes.whoseIcon} />
      <span className={classes.whoseText}>
        <strong>{whoseMoney(who, people)}.</strong>{' '}
        {who === 'family' ? 'You change only your own.' : `Only ${name} changes it.`}
        {children && <> {children}</>}
      </span>
      {onMine && (
        <UnstyledButton className={classes.backToMine} onClick={onMine}>
          Back to mine
        </UnstyledButton>
      )}
    </p>
  );
}
