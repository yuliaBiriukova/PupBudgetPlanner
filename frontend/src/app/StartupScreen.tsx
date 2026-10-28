import { Button, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Brand } from './shell/Logo';
import { useServerWake } from './shell/useServerWake';
import { WakePill } from './shell/WakePill';
import classes from './StartupScreen.module.css';

interface StartupScreenProps {
  /** The API didn't answer even after waiting for it to wake up. */
  failed?: boolean;
  onRetry?: () => void;
}

/** The first moment of the app, while it asks who is signed in: the name, and the waking-up pill at night. */
export function StartupScreen({ failed = false, onRetry }: StartupScreenProps) {
  const { t } = useTranslation();
  const wake = useServerWake();

  return (
    <div className={classes.root}>
      <WakePill waking={wake.waking} seconds={wake.seconds} />
      <Stack align="center" gap="md">
        <Brand />
        {failed && (
          <>
            <Text role="alert">{t('auth.startup.failed')}</Text>
            <Button onClick={onRetry}>{t('auth.startup.retry')}</Button>
          </>
        )}
      </Stack>
    </div>
  );
}
