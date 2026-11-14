import { Button, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCoins, IconDots, IconDownload, IconShare2, IconSquarePlus } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { cx } from '../../shared/ui/cx';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import shellClasses from '../shell/PhoneBars.module.css';
import type { InstallWay } from './install';
import classes from './Pwa.module.css';

/** The app's icon as the home screen shows it: the logo's sky as a rounded square. */
export function AppTile({ small = false }: { small?: boolean }) {
  return (
    <span className={cx(classes.tile, small && classes.tileSmall)} aria-hidden="true">
      <IconCoins size={small ? 24 : 32} stroke={1.7} />
    </span>
  );
}

/** One of Safari's buttons as the person finds it. */
function Key({ icon, children }: { icon: ReactNode; children?: ReactNode }) {
  return (
    <span className={classes.key}>
      {icon}
      {children}
    </span>
  );
}

interface InstallSheetProps {
  opened: boolean;
  /** Chrome's or Edge's own dialog, or Safari's taps. */
  way: Exclude<InstallWay, null>;
  onClose: () => void;
  onInstall: () => void;
}

/**
 * What installing gives and how (F-025): a piece of a home screen with the app on it, then the browser's own Install,
 * or on the iPhone Safari's three taps. A sheet on the phone, a dialog on the desktop.
 */
export function InstallSheet({ opened, way, onClose, onInstall }: InstallSheetProps) {
  const { t } = useTranslation();
  const ios = way === 'ios';

  return (
    <ResponsiveDialog
      opened={opened}
      onClose={onClose}
      title={t('pwa.install.title')}
      footer={
        <div className={classes.footer}>
          {ios ? (
            <Button onClick={onClose}>{t('pwa.install.gotIt')}</Button>
          ) : (
            <>
              <Button variant="quiet" onClick={onClose}>
                {t('pwa.install.notNow')}
              </Button>
              <Button leftSection={<IconDownload size={20} stroke={1.7} />} onClick={onInstall}>
                {t('pwa.install.install')}
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className={classes.homeScreen}>
        <AppTile />
        <span className={classes.tileName}>{t('app.shortName')}</span>
      </div>
      <p className={classes.lead}>{t('pwa.install.lead')}</p>
      {ios && (
        <ol className={classes.steps} aria-label={t('pwa.install.steps')}>
          <li className={classes.step}>
            <span>
              <Trans
                i18nKey="pwa.install.stepMore"
                components={{
                  more: (
                    <Key
                      icon={<IconDots size={16} stroke={1.7} aria-label={t('pwa.install.more')} />}
                    />
                  ),
                }}
              />
            </span>
          </li>
          <li className={classes.step}>
            <span>
              <Trans
                i18nKey="pwa.install.stepShare"
                components={{ share: <Key icon={<IconShare2 size={16} stroke={1.7} />} /> }}
              />
            </span>
          </li>
          <li className={classes.step}>
            <span>
              <Trans
                i18nKey="pwa.install.stepAdd"
                components={{ add: <Key icon={<IconSquarePlus size={16} stroke={1.7} />} /> }}
              />
            </span>
          </li>
        </ol>
      )}
    </ResponsiveDialog>
  );
}

interface InstallCardProps {
  onInstall: () => void;
  onDismiss: () => void;
}

/** Once at the top of the page on the phone, until Install or Not now (F-025). */
export function InstallCard({ onInstall, onDismiss }: InstallCardProps) {
  const { t } = useTranslation();

  return (
    <section className={classes.card} aria-label={t('pwa.install.title')}>
      <AppTile small />
      <div>
        <p className={classes.cardTitle}>{t('pwa.card.title')}</p>
        <p className={classes.cardText}>{t('pwa.card.text')}</p>
      </div>
      <div className={classes.cardButtons}>
        <Button onClick={onInstall}>{t('pwa.install.install')}</Button>
        <Button
          variant="quiet"
          onClick={() => {
            onDismiss();
            notifications.show({ message: t('pwa.card.inMore') });
          }}
        >
          {t('pwa.install.notNow')}
        </Button>
      </div>
    </section>
  );
}

/** The first row in More once the card is gone, with a line on what it gives. */
export function InstallMoreRow({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();

  return (
    <UnstyledButton className={shellClasses.menuItem} onClick={onClick}>
      <IconDownload size={20} stroke={1.7} />
      <span className={classes.rowText}>
        {t('pwa.install.title')}
        <span className={classes.rowLine}>{t('pwa.install.rowLine')}</span>
      </span>
    </UnstyledButton>
  );
}
