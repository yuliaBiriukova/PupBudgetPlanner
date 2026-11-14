import { Button, Loader, UnstyledButton } from '@mantine/core';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import { useId, type ReactNode } from 'react';
import { formatMoney } from '../../shared/format/money';
import { PasswordField, TextField } from '../../features/auth/AuthFormParts';
import { AuthLayout } from '../../features/auth/AuthLayout';
import { GoogleLogo } from '../../features/auth/GoogleLogo';
import pills from '../../shared/ui/Pills.module.css';
import { cx } from '../../shared/ui/cx';
import { FAMILY, ME, PASSWORD, SUMMARY, WORD } from './deleteData';
import type { DeleteFlow } from './deleteFlow';
import classes from './DeleteAccount.module.css';

const numbers = new Intl.NumberFormat('en-GB');
const count = (n: number, one: string, many: string) =>
  `${numbers.format(n).replace(/,/g, ' ')} ${n === 1 ? one : many}`;

/** What goes: a short ledger, figures right-aligned. */
export function WhatGoes({ withMoney = false }: { withMoney?: boolean }) {
  return (
    <div className={classes.ledger}>
      <dl className={classes.rows}>
        {withMoney ? (
          SUMMARY.totals.map((total) => (
            <div key={total.currency} className={classes.row}>
              <dt>
                {count(total.accounts, 'account', 'accounts')} in {total.currency}
              </dt>
              <dd className={classes.figure}>{formatMoney(total.total, total.currency)}</dd>
            </div>
          ))
        ) : (
          <div className={classes.row}>
            <dt>Accounts</dt>
            <dd className={classes.figure}>{numbers.format(SUMMARY.accounts)}</dd>
          </div>
        )}
        <div className={classes.row}>
          <dt>
            Transactions
            {withMoney && <span className={classes.since}> since {SUMMARY.since}</span>}
          </dt>
          <dd className={classes.figure}>
            {numbers.format(SUMMARY.transactions).replace(/,/g, ' ')}
          </dd>
        </div>
        <div className={classes.row}>
          <dt>Categories</dt>
          <dd className={classes.figure}>{SUMMARY.categories}</dd>
        </div>
        <div className={classes.row}>
          <dt>Your settings and the ways you sign in</dt>
          <dd />
        </div>
      </dl>
      <p className={classes.note}>
        The money itself stays in your banks: only Pup’s record of it goes.
      </p>
    </div>
  );
}

/** A part of the confirmation: a short title, a line, its control. */
export function Part({
  title,
  text,
  number,
  children,
}: {
  title: string;
  text?: string;
  /** Shown before the title in a sequence (variant 2). */
  number?: number;
  children?: ReactNode;
}) {
  return (
    <div className={classes.part}>
      <h3 className={classes.partTitle}>
        {number !== undefined && <span className={classes.number}>{number}</span>}
        {title}
      </h3>
      {text && <p className={classes.partText}>{text}</p>}
      {children}
    </div>
  );
}

/** The family: a member just leaves; an owner with others picks who looks after it next (as "Leave family"). */
export function FamilyPart({ flow, number }: { flow: DeleteFlow; number?: number }) {
  const labelId = useId();
  if (flow.family === 'none') return null;
  if (flow.family === 'member') {
    return (
      <Part
        number={number}
        title={`You leave the ${FAMILY.name} family`}
        text={`${FAMILY.others.map((o) => o.name).join(' and ')} won’t see your money any more.`}
      />
    );
  }
  return (
    <Part
      number={number}
      title="Who looks after the family next?"
      text={`You leave the ${FAMILY.name} family. They can rename it and invite people.`}
    >
      <div className={pills.pills} role="radiogroup" aria-labelledby={labelId}>
        <span id={labelId} hidden>
          Who looks after the family next
        </span>
        {FAMILY.others.map((other) => (
          <UnstyledButton
            key={other.id}
            className={pills.pill}
            role="radio"
            aria-checked={flow.heir === other.id}
            onClick={() => {
              flow.pickHeir(other.id);
            }}
          >
            {other.name}
          </UnstyledButton>
        ))}
      </div>
      {flow.errors.heir && <FieldError text={flow.errors.heir} />}
    </Part>
  );
}

/** It's you: the password again, or Google once more. */
export function ProofPart({ flow, number }: { flow: DeleteFlow; number?: number }) {
  if (flow.who === 'google') {
    return (
      <Part
        number={number}
        title="Confirm it’s you"
        text="You sign in with Google, so sign in with it once more."
      >
        {flow.google === 'yes' ? (
          <p className={classes.confirmed}>
            <IconCircleCheck size={20} stroke={1.7} aria-hidden />
            Confirmed with Google as {ME.email}
          </p>
        ) : (
          <Button
            variant="default"
            className={classes.google}
            aria-busy={flow.google === 'leaving' || undefined}
            leftSection={
              flow.google === 'leaving' ? (
                <Loader size={18} color="currentColor" aria-hidden />
              ) : (
                <GoogleLogo />
              )
            }
            onClick={flow.confirmWithGoogle}
          >
            {flow.google === 'leaving' ? 'Opening Google' : 'Confirm with Google'}
          </Button>
        )}
        {flow.errors.proof && <FieldError text={flow.errors.proof} />}
      </Part>
    );
  }
  return (
    <Part number={number} title="Confirm it’s you">
      <PasswordField
        label="Your password"
        value={flow.password}
        autoComplete="current-password"
        error={flow.errors.proof}
        description={`In the prototype: ${PASSWORD}`}
        onChange={(event) => {
          flow.typePassword(event.currentTarget.value);
        }}
      />
    </Part>
  );
}

/** The typed word. */
export function WordPart({ flow, number }: { flow: DeleteFlow; number?: number }) {
  return (
    <Part number={number} title={`Type ${WORD} to confirm`}>
      <TextField
        aria-label={`Type ${WORD} to confirm`}
        value={flow.word}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        error={flow.errors.word}
        onChange={(event) => {
          flow.typeWord(event.currentTarget.value);
        }}
      />
    </Part>
  );
}

/** Said once, near the button: what coming back means (invite-only, F-028). */
export function ComingBack() {
  return (
    <p className={classes.note}>
      It can’t be undone. To use Pup Budget again later, you’d need a new invite link.
    </p>
  );
}

function FieldError({ text }: { text: string }) {
  return (
    <p className={classes.fieldError} role="alert">
      <IconAlertCircle size={16} stroke={1.7} aria-hidden />
      {text}
    </p>
  );
}

/** The admin: no button, a line why (open point 6). */
export function AdminLine() {
  return (
    <p className={classes.adminLine}>
      You look after Pup Budget, so your account can’t be deleted here: without you nobody could be
      invited.
    </p>
  );
}

/** After the deletion: signed out, on the sign-in frame. */
export function DeletedScreen({ onAgain }: { onAgain: () => void }) {
  return (
    <AuthLayout withSwitch={false}>
      <div className={classes.deleted}>
        <h1 className={classes.deletedTitle}>Your account is deleted</h1>
        <p>Everything in it is gone, and you’re signed out on every device.</p>
        <p className={classes.dim}>
          To use Pup Budget again, you’d need a new invite link from the person who looks after it.
        </p>
        <Button variant="quiet" className={cx(classes.again)} onClick={onAgain}>
          Back to the prototype
        </Button>
      </div>
    </AuthLayout>
  );
}
