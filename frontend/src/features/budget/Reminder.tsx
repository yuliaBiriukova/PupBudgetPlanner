import { ActionIcon, Button, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBell, IconCalendarEvent, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { AppTile, InstallSheet } from '../../app/pwa/InstallParts';
import { monthName, shiftMonth, thisMonth } from './budget';
import { monthBudgetQuery, useStartMonth } from './budgetApi';
import { NotificationsBlocked, useReminder, useReminderCard, useSetReminder } from './reminderApi';
import r from './Reminder.module.css';

/**
 * The push on the 1st as a phone shows it (F-033): a piece of a lock screen with Pup's notification for next month.
 * The phone draws the real one, so Android and the iPhone differ a little; the words and the icon are ours.
 */
export function PushPreview({ month = shiftMonth(thisMonth(), 1) }: { month?: string }) {
  const { t } = useTranslation();
  return (
    <figure className={r.lock} aria-label={t('budget.reminder.preview')}>
      <span className={r.time}>09:00</span>
      <span className={r.date}>{dayjs(`${month}-01`).format('dddd, D MMMM')}</span>
      <span className={r.note}>
        <AppTile small />
        <span className={r.noteText}>
          <span className={r.noteHead}>
            <span>{t('budget.reminder.appName')}</span>
            <span className={r.now}>{t('budget.reminder.now')}</span>
          </span>
          <b className={r.noteTitle}>
            {t('budget.reminder.pushTitle', { month: monthName(month) })}
          </b>
          <span>{t('budget.reminder.pushBody', { from: monthName(shiftMonth(month, -1)) })}</span>
        </span>
      </span>
    </figure>
  );
}

/**
 * On this month's Budget page while this device has no reminder: what it is, the notification it sends, and Turn on
 * (the browser then asks to allow notifications) or Not now, which hides it for good (Settings keeps the switch). On an
 * iPhone in Safari notifications come only to the installed app: the card says so and shows how to install it.
 */
export function ReminderCard() {
  const { t } = useTranslation();
  const { data: state } = useReminder();
  const card = useReminderCard();
  const setReminder = useSetReminder();
  const [installOpen, setInstallOpen] = useState(false);
  if (card.dismissed || (state !== 'off' && state !== 'install-first')) return null;
  const iphone = state === 'install-first';
  return (
    <section className={r.card} aria-labelledby="budget-reminder-title">
      <h2 id="budget-reminder-title" className={r.cardTitle}>
        <IconBell size={20} stroke={1.7} aria-hidden />
        {t('budget.reminder.title')}
      </h2>
      <p className={r.cardText}>
        {iphone ? t('budget.reminder.textIphone') : t('budget.reminder.text')}
      </p>
      <PushPreview />
      <div className={r.cardButtons}>
        {iphone ? (
          <Button
            onClick={() => {
              setInstallOpen(true);
            }}
          >
            {t('budget.reminder.howToInstall')}
          </Button>
        ) : (
          <Button
            loading={setReminder.isPending}
            onClick={() => {
              setReminder.mutate(true, {
                onSuccess: () => notifications.show({ message: t('budget.reminder.on') }),
                onError: (error) =>
                  notifications.show({
                    color: 'red',
                    message:
                      error instanceof NotificationsBlocked
                        ? t('budget.reminder.blocked')
                        : t('budget.reminder.error'),
                  }),
              });
            }}
          >
            {t('budget.reminder.turnOn')}
          </Button>
        )}
        <Button variant="quiet" onClick={card.dismiss}>
          {t('budget.reminder.notNow')}
        </Button>
      </div>
      {iphone && (
        <InstallSheet
          opened={installOpen}
          way="ios"
          onClose={() => {
            setInstallOpen(false);
          }}
          onInstall={() => {
            setInstallOpen(false);
          }}
        />
      )}
    </section>
  );
}

/** "Closed" for this month on this device: the banner comes back next month. */
const BANNER_KEY = 'pup.budgetBanner';

function readClosed(): string | null {
  try {
    return localStorage.getItem(BANNER_KEY);
  } catch {
    return null;
  }
}

/**
 * The reminder in the app (F-033): over every page but Budget while this month isn't planned, for someone who has
 * planned a month before, until it is planned or closed. *Start from October* plans it as a copy of the last planned
 * month and opens the Budget page.
 */
export function ReminderBanner() {
  const { t } = useTranslation();
  const month = thisMonth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data } = useQuery(monthBudgetQuery(month));
  const start = useStartMonth();
  const [closed, setClosed] = useState(readClosed);
  if (
    !data ||
    data.planned ||
    !data.startFrom ||
    closed === month ||
    pathname.startsWith('/budget')
  )
    return null;
  const from = monthName(data.startFrom);
  return (
    <div className={r.banner} role="status">
      <IconCalendarEvent size={20} stroke={1.7} className={r.bannerIcon} aria-hidden />
      <p className={r.bannerText}>
        <Trans
          i18nKey="budget.banner.text"
          values={{ month: monthName(month), from }}
          components={{ b: <b /> }}
        />
      </p>
      <UnstyledButton
        className={r.bannerLink}
        disabled={start.isPending}
        onClick={() => {
          start.mutate(
            { month, copyLast: true },
            {
              onSuccess: () => {
                void navigate('/budget');
                notifications.show({
                  message: t('budget.empty.started', { month: monthName(month), from }),
                });
              },
              onError: () => notifications.show({ color: 'red', message: t('budget.empty.error') }),
            },
          );
        }}
      >
        {t('budget.banner.startFrom', { from })}
      </UnstyledButton>
      <ActionIcon
        variant="subtle"
        color="gray"
        aria-label={t('common.close')}
        onClick={() => {
          try {
            localStorage.setItem(BANNER_KEY, month);
          } catch {
            // Closed for this visit only
          }
          setClosed(month);
        }}
      >
        <IconX size={20} stroke={1.7} />
      </ActionIcon>
    </div>
  );
}
