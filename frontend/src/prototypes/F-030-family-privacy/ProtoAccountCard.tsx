import { UnstyledButton, VisuallyHidden } from '@mantine/core';
import { IconCoins, IconEyeOff, IconPlus } from '@tabler/icons-react';
import type { CSSProperties, ReactNode } from 'react';
import { formatMoney } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import classes from '../../features/accounts/AccountCard.module.css';
import type { CardStyle } from '../../features/accounts/accountsApi';
import proto from './FamilyPrivacy.module.css';
import type { Level } from './privacy';

interface AccountCardProps {
  name: string;
  /** What the group doesn't already say: the source when grouped by currency. */
  meta?: string;
  /** The currency's code when the group doesn't say it (grouped by source). */
  code?: string;
  balance: number;
  currency: string;
  cardStyle: CardStyle;
  /** Opens the account; without it the card is a picture (the form's preview). */
  onClick?: () => void;
  /** Just added or restored, or its balance just changed: a short accent ring. */
  isNew?: boolean;
  /**
   * Adds a transaction from this account (F-018): a column on the card's right after a thin rule, its own button next
   * to the card's (variant 9, the split edge). `addLabel` names it for screen readers.
   */
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
  /** F-030: what the family sees of your own account, when it isn't everything. */
  privacy?: Level;
  /** The mark's words when they aren't about your own card (someone else's balance-only card). */
  privacyLabel?: string;
}

/** One account as a card in its style: Solid, Tinted, Envelope or Plain (F-014). */
export function AccountCard({
  name,
  meta,
  code,
  balance,
  currency,
  cardStyle,
  onClick,
  isNew,
  onAdd,
  addLabel,
  className,
  privacy,
  privacyLabel,
}: AccountCardProps) {
  const amount = formatMoney(balance, currency);
  const content = (
    <>
      <span className={classes.top}>
        <span className={classes.name}>
          {privacy && privacy !== 'Everything' && (
            <span
              className={proto.cardMark}
              title={
                privacyLabel ??
                (privacy === 'Hidden'
                  ? 'Hidden from the family'
                  : 'The family sees the balance only')
              }
            >
              {privacy === 'Hidden' ? (
                <IconEyeOff size={16} stroke={1.7} aria-hidden />
              ) : (
                <IconCoins size={16} stroke={1.7} aria-hidden />
              )}
              <VisuallyHidden>
                {privacyLabel
                  ? `${privacyLabel}:`
                  : privacy === 'Hidden'
                    ? 'Hidden from the family:'
                    : 'The family sees the balance only:'}
              </VisuallyHidden>
            </span>
          )}
          {name}
        </span>
        {code && <span className={classes.code}>{code}</span>}
        {meta && <span className={classes.meta}>{meta}</span>}
      </span>
      <span
        className={cx(classes.balance, balance < 0 && classes.debt)}
        // Its length sizes it next to the split edge (B-003)
        style={{ '--chars': amount.length } as CSSProperties}
      >
        {amount}
      </span>
    </>
  );
  const props = {
    className: cx(classes.card, className),
    'data-style': cardStyle,
    'data-new': isNew ? true : undefined,
    'data-edge': onAdd ? true : undefined,
  };

  const card = onClick ? (
    <UnstyledButton {...props} onClick={onClick}>
      {content}
    </UnstyledButton>
  ) : (
    <div {...props}>{content}</div>
  );
  if (!onAdd) return card;

  // The card and its edge share one cell, side by side: never a button inside a button. The wrapper carries the card's
  // colors, so the edge is drawn in them too
  return (
    <div className={classes.withEdge} data-style={cardStyle}>
      {card}
      <UnstyledButton className={classes.edge} aria-label={addLabel} onClick={onAdd}>
        <IconPlus size={20} stroke={1.7} aria-hidden />
      </UnstyledButton>
    </div>
  );
}

/** The dashed card at the end of a group: adds an account to it. */
export function AddCard({
  label,
  onClick,
  className,
}: {
  label: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <UnstyledButton className={cx(classes.ghost, className)} onClick={onClick}>
      <IconPlus size={20} stroke={1.7} aria-hidden />
      <span>{label}</span>
    </UnstyledButton>
  );
}

/** A small drawing of a card style, for the style picker. */
export function CardStyleMini({ cardStyle }: { cardStyle: CardStyle }) {
  return (
    <span className={classes.mini} data-style={cardStyle} aria-hidden="true">
      <i />
      <i />
    </span>
  );
}
