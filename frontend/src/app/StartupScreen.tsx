import { Button, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useOnline } from './pwa/online';
import { Brand } from './shell/Logo';
import { useServerWake } from './shell/useServerWake';
import { WakePill } from './shell/WakePill';
import classes from './StartupScreen.module.css';

interface StartupScreenProps {
  /** The API didn't answer even after waiting for it to wake up. */
  failed?: boolean;
  onRetry?: () => void;
}

/**
 * The first moment of the app, while it asks who is signed in: the name, and the waking-up pill at night. Without a
 * network (the installed app opens from its cache, F-025) it says the phone is offline; the app goes on by itself
 * once the network is back, and Try again loads the page again.
 */
export function StartupScreen({ failed = false, onRetry }: StartupScreenProps) {
  const { t } = useTranslation();
  const wake = useServerWake();
  const online = useOnline();

  return (
    <div className={classes.root}>
      {online && <WakePill waking={wake.waking} seconds={wake.seconds} />}
      <Stack align="center" gap="md">
        <Brand />
        {!online ? (
          <>
            <Text role="alert" ta="center" className={classes.text}>
              {t('pwa.offline.title')}
              <br />
              <Text span c="dimmed" inherit>
                {t('pwa.offline.text')}
              </Text>
            </Text>
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              {t('auth.startup.retry')}
            </Button>
          </>
        ) : (
          failed && (
            <>
              <Text role="alert">{t('auth.startup.failed')}</Text>
              <Button onClick={onRetry}>{t('auth.startup.retry')}</Button>
            </>
          )
        )}
      </Stack>
    </div>
  );
}
