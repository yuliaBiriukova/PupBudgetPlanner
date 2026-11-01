import { UnstyledButton } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { formatMoney } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import classes from './AccountCard.module.css';
import type { CardStyle } from './accountsApi';

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
  /** A button sits in its top right corner (the + that adds a transaction, F-018): the name keeps clear of it. */
  withCorner?: boolean;
  className?: string;
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
  withCorner,
  className,
}: AccountCardProps) {
  const content = (
    <>
      <span className={classes.top}>
        <span className={classes.name}>{name}</span>
        {code && <span className={classes.code}>{code}</span>}
        {meta && <span className={classes.meta}>{meta}</span>}
      </span>
      <span className={cx(classes.balance, balance < 0 && classes.debt)}>
        {formatMoney(balance, currency)}
      </span>
    </>
  );
  const props = {
    className: cx(classes.card, className),
    'data-style': cardStyle,
    'data-new': isNew ? true : undefined,
    'data-corner': withCorner ? true : undefined,
  };

  return onClick ? (
    <UnstyledButton {...props} onClick={onClick}>
      {content}
    </UnstyledButton>
  ) : (
    <div {...props}>{content}</div>
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
