import { ActionIcon, TextInput, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';
import {
  forwardRef,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { formatMoney } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import { today } from './days';
import {
  choiceOf,
  PERIOD_CHOICES,
  periodName,
  periodOf,
  stepped,
  type Period,
  type PeriodChoice,
} from './filters';
import { Picker } from './Picker';
import formClasses from './TransactionForm.module.css';
import classes from './TransactionsPage.module.css';
import type { TransactionSummary } from './transactionsApi';

/** How far a swipe goes before it moves the month, and how far the figures follow the finger. */
const SWIPE_PX = 56;
const FOLLOW = 0.5;
/** Past this month the figures only give a little: there is nothing after it. */
const FOLLOW_AT_END = 0.15;

interface TotalsSlipProps {
  period: Period;
  onPeriod: (period: Period) => void;
  /** The phone's period sheet closed: its picks go into the address. */
  onSettle: () => void;
  /** Empty while it loads. */
  summary?: TransactionSummary;
  summaryError?: boolean;
  onRetry: () => void;
  /** Filters besides the period are on: the totals are of what's picked. */
  picked: boolean;
  /** The phone: a swipe moves the month (or year), and Add transaction is a round + (variant 9). */
  swipe: boolean;
  /** Opens the quick-add form. */
  onAdd: () => void;
}

/**
 * The period's totals (F-020, variant 8): spent and received, big, on a dark slip with a torn edge; a bar for how much
 * of what came in is spent and what's left. The period is its title with ‹ ›, and the title opens the period list.
 * On the phone a swipe left or right moves to the next or previous month; the figures follow the finger a little,
 * and nothing happens past this month. Add transaction ends the month row (variant 9): a light pill, a round + on the
 * phone and on a slip too narrow for its words.
 */
export const TotalsSlip = forwardRef<HTMLElement, TotalsSlipProps>(function TotalsSlip(
  { period, onPeriod, onSettle, summary, summaryError, onRetry, picked, swipe, onAdd },
  ref,
) {
  const { t } = useTranslation();
  const figures = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; sideways: boolean | null } | null>(null);
  const swallowClick = useRef(false);
  const unit = period.kind === 'year' ? 'Year' : 'Month';
  const previous = stepped(period, -1);
  const next = stepped(period, 1);

  const follow = (dx: number | null) => {
    const el = figures.current;
    if (!el) return;
    el.toggleAttribute('data-dragging', dx !== null);
    el.style.transform = dx === null ? '' : `translateX(${String(dx)}px)`;
    el.style.opacity = dx === null ? '' : String(1 - Math.min(0.6, Math.abs(dx) / 300));
  };

  // Only a finger swipes, and only a month or a year
  const swipes = swipe && (!!previous || !!next);
  const onPointerDown = (event: PointerEvent) => {
    if (!swipes || event.pointerType === 'mouse') return;
    drag.current = { x: event.clientX, y: event.clientY, sideways: null };
  };
  const onPointerMove = (event: PointerEvent) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (start.sideways === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10))
      start.sideways = Math.abs(dx) > Math.abs(dy);
    if (!start.sideways) return;
    const target = dx < 0 ? next : previous;
    follow(dx * (target ? FOLLOW : FOLLOW_AT_END));
  };
  const onPointerUp = (event: PointerEvent) => {
    const start = drag.current;
    drag.current = null;
    follow(null);
    if (!start?.sideways) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) < SWIPE_PX) return;
    // A swipe isn't a tap on the period's name
    swallowClick.current = true;
    const target = dx < 0 ? next : previous;
    if (target) onPeriod(target);
  };
  const onPointerCancel = () => {
    drag.current = null;
    follow(null);
  };
  const onClickCapture = (event: MouseEvent) => {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const stepButton = (step: -1 | 1, target: Period | null) => (
    <ActionIcon
      variant="subtle"
      size={44}
      radius="xl"
      className={classes.step}
      disabled={!target}
      aria-label={t(`transactions.totals.${step < 0 ? 'previous' : 'next'}${unit}`)}
      onClick={() => {
        if (target) onPeriod(target);
      }}
    >
      {step < 0 ? (
        <IconChevronLeft size={20} stroke={1.7} />
      ) : (
        <IconChevronRight size={20} stroke={1.7} />
      )}
    </ActionIcon>
  );

  const steps = period.kind === 'month' || period.kind === 'year';
  return (
    <section
      ref={ref}
      aria-label={t('transactions.totals.label')}
      className={classes.slip}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClickCapture={onClickCapture}
    >
      <div className={classes.slipRow}>
        {steps && stepButton(-1, previous)}
        <PeriodPicker period={period} onPeriod={onPeriod} onSettle={onSettle} />
        {steps && stepButton(1, next)}
        <UnstyledButton
          className={classes.add}
          data-round={swipe || undefined}
          aria-label={swipe ? t('shell.addTransaction') : undefined}
          onClick={onAdd}
        >
          <IconPlus size={20} stroke={1.8} aria-hidden />
          <span className={classes.addLabel}>{t('shell.addTransaction')}</span>
        </UnstyledButton>
      </div>
      {summary ? (
        <div ref={figures}>
          <Figures summary={summary} picked={picked} period={period} />
        </div>
      ) : summaryError ? (
        <p className={classes.caption}>
          {t('transactions.totals.error')}{' '}
          <UnstyledButton className={classes.textLink} onClick={onRetry}>
            {t('transactions.list.retry')}
          </UnstyledButton>
        </p>
      ) : (
        <div className={classes.figuresLoading} aria-hidden="true">
          <span />
          <span />
        </div>
      )}
    </section>
  );
});

function Figures({
  summary,
  picked,
  period,
}: {
  summary: TransactionSummary;
  picked: boolean;
  period: Period;
}) {
  const { t } = useTranslation();
  const { spent, received, currency } = summary;
  const share = received > 0 ? Math.round((spent / received) * 100) : 0;
  const month = period.kind === 'month' ? 'Month' : 'Period';

  let caption: ReactNode = null;
  if (received > 0) {
    caption =
      received - spent >= 0 ? (
        <Trans
          i18nKey="transactions.totals.left"
          values={{ share, left: formatMoney(received - spent, currency) }}
          components={{ b: <b /> }}
        />
      ) : (
        <Trans
          i18nKey="transactions.totals.over"
          values={{ over: formatMoney(spent - received, currency) }}
          components={{ b: <b /> }}
        />
      );
  } else if (spent > 0) {
    caption = t(`transactions.totals.noIncome${month}${picked ? 'Picked' : ''}`);
  }

  return (
    <>
      <dl className={classes.figures}>
        <div>
          <dt>{t(picked ? 'transactions.totals.spentPicked' : 'transactions.totals.spent')}</dt>
          <dd>{formatMoney(spent, currency)}</dd>
        </div>
        <div>
          <dt>{t('transactions.totals.received')}</dt>
          <dd className={classes.received}>
            {received > 0 ? `+${formatMoney(received, currency)}` : formatMoney(0, currency)}
          </dd>
        </div>
      </dl>
      {received > 0 && (
        <div
          className={classes.ratio}
          role="img"
          aria-label={t('transactions.totals.shareOfIncome', { share })}
        >
          <span style={{ '--share': `${String(Math.min(100, share))}%` } as CSSProperties} />
        </div>
      )}
      {caption && <p className={classes.caption}>{caption}</p>}
      {summary.ratesMissing && (
        <p className={classes.caption}>{t('transactions.totals.ratesMissing')}</p>
      )}
    </>
  );
}

/** The period's title, and the period list it opens: a dropdown on the desktop, a sheet on the phone. */
function PeriodPicker({
  period,
  onPeriod,
  onSettle,
}: {
  period: Period;
  onPeriod: (period: Period) => void;
  onSettle: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const picked = choiceOf(period);
  const now = today();
  const close = () => {
    setOpen(false);
    onSettle();
  };

  const name =
    period.kind === 'month' ? (
      <>
        {dayjs(`${period.month}-01`).format('MMMM')}{' '}
        <span className={classes.year}>{period.month.slice(0, 4)}</span>
      </>
    ) : (
      periodName(period, t('transactions.totals.allTime'))
    );

  return (
    <Picker
      opened={open}
      onClose={close}
      title={t('transactions.period.title')}
      width={300}
      target={
        <UnstyledButton
          className={classes.periodButton}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setOpen(!open);
          }}
        >
          <VisuallyHidden>{t('transactions.totals.period')}</VisuallyHidden>
          <span className={classes.periodName}>{name}</span>
          <IconChevronDown size={20} stroke={1.7} aria-hidden />
        </UnstyledButton>
      }
    >
      <div className={formClasses.listScroll} data-first>
        <ul className={formClasses.list}>
          {PERIOD_CHOICES.map((choice: PeriodChoice) => (
            <li key={choice}>
              <UnstyledButton
                className={formClasses.listItem}
                aria-pressed={picked === choice}
                data-autofocus={picked === choice || undefined}
                onClick={() => {
                  onPeriod(periodOf(choice, period));
                  if (choice !== 'range') close();
                }}
              >
                <span className={formClasses.listName}>{t(`transactions.period.${choice}`)}</span>
                {choice === 'range' && period.kind === 'range' && (
                  <span className={formClasses.balance}>{periodName(period, '')}</span>
                )}
              </UnstyledButton>
            </li>
          ))}
        </ul>
        {period.kind === 'range' && (
          <div className={classes.range}>
            {(['from', 'to'] as const).map((end) => (
              <TextInput
                key={end}
                type="date"
                label={t(`transactions.period.${end}`)}
                value={period[end]}
                max={now}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (!value || value > now) return;
                  const other = end === 'from' ? period.to : period.from;
                  const [from, to] = end === 'from' ? [value, other] : [other, value];
                  onPeriod({
                    kind: 'range',
                    from: from <= to ? from : to,
                    to: from <= to ? to : from,
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Picker>
  );
}

/** The slim bar's figures: spent and, when there was any, received. */
export function MiniFigures({ summary }: { summary?: TransactionSummary }) {
  const { t } = useTranslation();
  if (!summary) return null;
  return (
    <span className={classes.miniFigures}>
      <span>
        <VisuallyHidden>{t('transactions.totals.spentShort')}</VisuallyHidden>
        {formatMoney(summary.spent, summary.currency)}
      </span>
      {summary.received > 0 && (
        <span className={cx(classes.miniReceived)}>
          <VisuallyHidden>{t('transactions.totals.receivedShort')}</VisuallyHidden>+
          {formatMoney(summary.received, summary.currency)}
        </span>
      )}
    </span>
  );
}
