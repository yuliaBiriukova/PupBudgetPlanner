import { Button, Stack, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCoins,
  IconDots,
  IconDownload,
  IconRefresh,
  IconShare2,
  IconSquarePlus,
  IconWifiOff,
} from '@tabler/icons-react';
import { useEffect } from 'react';
import { Brand } from '../../app/shell/Logo';
import { cx } from '../../shared/ui/cx';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import shellClasses from '../../app/shell/PhoneBars.module.css';
import classes from './Pwa.module.css';
import { usePwa, type Moment, type Platform } from './pwa';

/** The app's icon as the home screen will show it. */
export function AppTile({ small = false }: { small?: boolean }) {
  return (
    <span className={cx(classes.tile, small && classes.tileSmall)} aria-hidden="true">
      <IconCoins size={small ? 24 : 32} stroke={1.7} />
    </span>
  );
}

interface InstallSheetProps {
  opened: boolean;
  platform: Platform;
  onClose: () => void;
  onInstall: () => void;
}

/**
 * Every variant's sheet (a dialog on the desktop): a piece of a home screen with the app on it, what it gives, and
 * the browser's own Install, or Safari's three taps on the iPhone.
 */
export function InstallSheet({ opened, platform, onClose, onInstall }: InstallSheetProps) {
  const iphone = platform === 'iPhone Safari';
  return (
    <ResponsiveDialog
      opened={opened}
      onClose={onClose}
      title="Install the app"
      footer={
        <div className={classes.footer}>
          {iphone ? (
            <Button onClick={onClose}>Got it</Button>
          ) : (
            <>
              <Button variant="quiet" onClick={onClose}>
                Not now
              </Button>
              <Button leftSection={<IconDownload size={20} stroke={1.7} />} onClick={onInstall}>
                Install
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className={classes.homeScreen}>
        <AppTile />
        <span className={classes.tileName}>Pup Budget</span>
      </div>
      <p className={classes.lead}>
        Pup Budget gets its own icon and opens without the browser’s bars: at once, even while the
        server sleeps at night.
      </p>
      {iphone && (
        <ol className={classes.steps} aria-label="In Safari">
          <li className={classes.step}>
            <span>
              Tap{' '}
              <span className={classes.key}>
                <IconDots size={16} stroke={1.7} aria-label="More" />
              </span>{' '}
              in Safari’s bar
            </span>
          </li>
          <li className={classes.step}>
            <span>
              Tap{' '}
              <span className={classes.key}>
                <IconShare2 size={16} stroke={1.7} />
                Share
              </span>
            </span>
          </li>
          <li className={classes.step}>
            <span>
              Tap{' '}
              <span className={classes.key}>
                <IconSquarePlus size={16} stroke={1.7} />
                Add to Home Screen
              </span>
              , then Add
            </span>
          </li>
        </ol>
      )}
    </ResponsiveDialog>
  );
}

/** Variants 2 and 3: once at the top of the page on the phone, with Install and Not now. */
export function InstallCard() {
  const pwa = usePwa();
  return (
    <section className={classes.card} aria-label="Install the app">
      <AppTile small />
      <div>
        <p className={classes.cardTitle}>Pup Budget on your home screen</p>
        <p className={classes.cardText}>Opens at once, even while the server sleeps at night.</p>
      </div>
      <div className={classes.cardButtons}>
        <Button onClick={pwa.openSheet}>Install</Button>
        <Button
          variant="quiet"
          onClick={() => {
            pwa.dismissCard();
            if (pwa.variant === 'both')
              notifications.show({ message: 'It’s in More whenever you want it.' });
          }}
        >
          Not now
        </Button>
      </div>
    </section>
  );
}

/** Variants 1 and 3: the row in More, with a line on what it gives. */
export function InstallMoreRow({ onClick }: { onClick: () => void }) {
  return (
    <UnstyledButton className={shellClasses.menuItem} onClick={onClick}>
      <IconDownload size={20} stroke={1.7} />
      <span className={classes.rowText}>
        Install the app
        <span className={classes.rowLine}>Opens at once from your home screen</span>
      </span>
    </UnstyledButton>
  );
}

/** At the top, where the waking-up pill is, while the network is gone. */
export function OfflinePill({ offline }: { offline: boolean }) {
  return offline ? (
    <span className={classes.offlinePill}>
      <IconWifiOff size={16} stroke={1.7} aria-hidden="true" />
      No connection: you can look, not save
    </span>
  ) : null;
}

/** The start screen opened from the home screen without a network. */
export function OfflineStart() {
  return (
    <div className={classes.start}>
      <Stack align="center" gap="md">
        <Brand />
        <p className={classes.startText} role="alert">
          You’re offline.
          <br />
          <span className={classes.startLine}>
            Pup Budget opens once the phone is online again.
          </span>
        </p>
        <Button>Try again</Button>
      </Stack>
    </div>
  );
}

/** Every variant: after a release, a toast that stays until Reload or ×. Draws nothing itself. */
export function UpdateNotice({ moment }: { moment: Moment }) {
  useEffect(() => {
    if (moment !== 'Update ready') return;
    const timer = setTimeout(() => {
      notifications.show({
        id: 'pwa-update',
        autoClose: false,
        message: (
          <span className={classes.update}>
            <span className={classes.updateText}>A new version is ready.</span>
            <Button
              leftSection={<IconRefresh size={20} stroke={1.7} />}
              onClick={() => {
                notifications.hide('pwa-update');
                notifications.show({ message: 'Pup Budget is up to date.', autoClose: 2500 });
              }}
            >
              Reload
            </Button>
          </span>
        ),
      });
    }, 800);
    return () => {
      clearTimeout(timer);
      notifications.hide('pwa-update');
    };
  }, [moment]);
  return null;
}
